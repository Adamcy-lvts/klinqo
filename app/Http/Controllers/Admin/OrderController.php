<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\InvalidOrderTransitionException;
use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    use ResolvesCurrentBusiness;

    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): Response
    {
        $business = $this->requireBusiness($request);

        $status = $request->query('status');
        $query = $business->orders()->with('user:id,name,phone')->latest('placed_at');

        if (is_string($status) && in_array($status, array_keys(Order::TRANSITIONS), true)) {
            $query->where('status', $status);
        }

        return Inertia::render('admin/orders/Index', [
            'businessId' => $business->id,
            'orders' => $query->paginate(20)->withQueryString(),
            'filters' => ['status' => $status],
            'statusCounts' => $business->orders()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
        ]);
    }

    public function show(Request $request, Order $order): Response
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $order->business_id);

        return Inertia::render('admin/orders/Show', [
            'order' => $order->load(['items', 'user:id,name,phone', 'address', 'deliveryMethod']),
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $order->business_id);

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(array_keys(Order::TRANSITIONS))],
        ]);

        try {
            $this->orders->transition($order, $validated['status']);
        } catch (InvalidOrderTransitionException $e) {
            throw ValidationException::withMessages(['status' => [$e->getMessage()]]);
        }

        return back();
    }
}
