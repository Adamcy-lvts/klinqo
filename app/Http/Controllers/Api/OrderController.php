<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InvalidOrderTransitionException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    /**
     * The authenticated customer's orders, newest first.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $orders = $request->user()
            ->orders()
            ->with(['business', 'items'])
            ->latest('placed_at')
            ->paginate(15);

        return OrderResource::collection($orders);
    }

    /**
     * Place an order (server-side priced).
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orders->place($request->user(), $request->validated());

        return (new OrderResource($order->load(['business', 'deliveryMethod', 'address', 'items'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Order $order): OrderResource
    {
        Gate::authorize('view', $order);

        return new OrderResource($order->load(['business', 'deliveryMethod', 'address', 'items']));
    }

    /**
     * Lightweight tracking payload for the customer's tracking screen.
     */
    public function track(Order $order): JsonResponse
    {
        Gate::authorize('view', $order);

        return response()->json([
            'order_number' => $order->order_number,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'delivery_type' => $order->delivery_type,
            'updated_at' => $order->updated_at,
            'steps' => $this->steps($order),
        ]);
    }

    /**
     * Customer cancellation (only while placed/confirmed).
     */
    public function cancel(Order $order): OrderResource
    {
        Gate::authorize('cancel', $order);

        if (! $order->isCancellable()) {
            throw ValidationException::withMessages([
                'status' => ['This order can no longer be cancelled.'],
            ]);
        }

        $this->orders->transition($order, Order::STATUS_CANCELLED);

        return new OrderResource($order->load(['business', 'items']));
    }

    /**
     * Kitchen owner / admin advancing the order through the status machine.
     */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): OrderResource
    {
        Gate::authorize('updateStatus', $order);

        try {
            $this->orders->transition($order, (string) $request->string('status'));
        } catch (InvalidOrderTransitionException $e) {
            throw ValidationException::withMessages(['status' => [$e->getMessage()]]);
        }

        return new OrderResource($order->load(['business', 'items']));
    }

    /**
     * Build the ordered tracking timeline with reached/current markers.
     *
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
