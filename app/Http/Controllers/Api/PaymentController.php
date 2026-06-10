<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaystackService $paystack,
        private readonly OrderService $orders,
    ) {}

    /**
     * Initialize a Paystack transaction for an online order (for Pop).
     */
    public function initialize(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
        ]);

        /** @var Order $order */
        $order = Order::with('business', 'user')->findOrFail($validated['order_id']);
        Gate::authorize('pay', $order);

        if ($order->payment_method !== 'online' || $order->payment_status !== 'pending') {
            throw ValidationException::withMessages([
                'order_id' => ['This order is not awaiting an online payment.'],
            ]);
        }

        $result = $this->paystack->initialize($order);
        $order->update(['payment_reference' => $result['reference']]);

        return response()->json($result);
    }

    /**
     * Server-side verification fallback (e.g. if the webhook is delayed).
     */
    public function verify(Request $request, string $reference): JsonResponse
    {
        /** @var Order $order */
        $order = Order::with('business')->where('payment_reference', $reference)->firstOrFail();
        Gate::authorize('pay', $order);

        $data = $this->paystack->verify($reference);

        if (($data['status'] ?? null) === 'success') {
            $this->orders->markPaid($order, $reference);
        }

        return response()->json([
            'payment_status' => $order->fresh()?->payment_status,
            'order' => new OrderResource($order->fresh()?->load(['business', 'items'])),
        ]);
    }
}
