<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    use ResolvesCurrentBusiness;

    public function index(Request $request): Response
    {
        $business = $this->requireBusiness($request);

        $customers = User::query()
            ->whereHas('orders', fn (Builder $q) => $q->where('business_id', $business->id))
            ->withCount(['orders as order_count' => fn (Builder $q) => $q->where('business_id', $business->id)])
            ->withSum(
                ['orders as total_spent' => fn (Builder $q) => $q->where('business_id', $business->id)->where('payment_status', 'paid')],
                'total',
            )
            ->orderByDesc('order_count')
            ->paginate(20);

        return Inertia::render('admin/customers/Index', [
            'customers' => $customers,
        ]);
    }

    public function show(Request $request, User $customer): Response
    {
        $business = $this->requireBusiness($request);

        abort_unless(
            $business->orders()->where('user_id', $customer->id)->exists(),
            404,
        );

        return Inertia::render('admin/customers/Show', [
            'customer' => $customer->only(['id', 'name', 'phone', 'email']),
            'orders' => $business->orders()
                ->where('user_id', $customer->id)
                ->latest('placed_at')
                ->get(['id', 'order_number', 'status', 'payment_status', 'total', 'placed_at']),
        ]);
    }
}
