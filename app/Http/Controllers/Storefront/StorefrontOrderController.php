<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\PaystackService;
use App\Services\ReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontOrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orders,
        private readonly PaystackService $paystack,
        private readonly ReviewService $reviews,
    ) {}

    /**
     * Customer-facing order tracking page.
     */
    public function track(Request $request, string $code, Order $order): Response
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        $order->load(['items', 'business:id,name,business_code', 'deliveryMethod', 'address', 'review']);

        return Inertia::render('storefront/OrderTracking', [
            'order' => $order,
            'steps' => $this->steps($order),
            'canReview' => $order->status === Order::STATUS_DELIVERED && $order->review === null,
        ]);
    }

    /**
     * Submit a review for a delivered order from the tracking page.
     */
    public function review(StoreReviewRequest $request, string $code, Order $order): RedirectResponse
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        $this->reviews->submit(
            $order,
            $request->user(),
            (int) $request->integer('rating'),
            $request->input('text'),
        );

        return back();
    }

    /**
     * Paystack redirect callback: verify the transaction, then show tracking.
     */
    public function paymentCallback(Request $request): RedirectResponse
    {
        $reference = (string) ($request->query('reference') ?? $request->query('trxref') ?? '');

        $order = Order::with('business:id,business_code')->where('payment_reference', $reference)->first();

        if ($order === null) {
            return redirect()->route('home');
        }

        abort_unless($order->user_id === $request->user()->id, 403);

        $data = $this->paystack->verify($reference);

        if (($data['status'] ?? null) === 'success') {
            $this->orders->markPaid($order, $reference);
        }

        return redirect()->route('storefront.order.track', [
            'code' => $order->business->business_code,
            'order' => $order->id,
        ]);
    }

    /**
     * @return list<array{status: string, reached: bool, current: bool}>
     */
    private function steps(Order $order): array
    {
        if ($order->status === Order::STATUS_CANCELLED) {
            return [['status' => Order::STATUS_CANCELLED, 'reached' => true, 'current' => true]];
        }

        $flow = $order->delivery_type === 'delivery'
            ? [Order::STATUS_PLACED, Order::STATUS_CONFIRMED, Order::STATUS_PREPARING, Order::STATUS_READY, Order::STATUS_DELIVERING, Order::STATUS_DELIVERED]
            : [Order::STATUS_PLACED, Order::STATUS_CONFIRMED, Order::STATUS_PREPARING, Order::STATUS_READY, Order::STATUS_DELIVERED];

        $currentIndex = array_search($order->status, $flow, true);
        $currentIndex = $currentIndex === false ? 0 : $currentIndex;

        return array_map(fn (string $status, int $i) => [
            'status' => $status,
            'reached' => $i <= $currentIndex,
            'current' => $i === $currentIndex,
        ], $flow, array_keys($flow));
    }
}
