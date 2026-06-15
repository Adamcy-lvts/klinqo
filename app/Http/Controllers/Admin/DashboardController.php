<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use ResolvesCurrentBusiness;

    public function index(Request $request): Response
    {
        $business = $this->currentBusiness($request);

        return Inertia::render('admin/Dashboard', [
            'business' => $business === null ? null : [
                'id' => $business->id,
                'name' => $business->name,
                'status' => $business->status,
                'business_code' => $business->business_code,
                'storefront_url' => route('storefront.show', $business->business_code),
            ],
            'metrics' => $business === null ? null : $this->metrics($business),
            'recentOrders' => $business === null ? [] : $this->recentOrders($business),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function metrics(Business $business): array
    {
        $todayOrders = $business->orders()->whereDate('placed_at', today());

        return [
            'orders_today' => (clone $todayOrders)->count(),
            'revenue_today' => (float) (clone $todayOrders)->where('payment_status', 'paid')->sum('total'),
            'pending_orders' => $business->orders()
                ->whereIn('status', [Order::STATUS_PLACED, Order::STATUS_CONFIRMED, Order::STATUS_PREPARING])
                ->count(),
            'active_items' => $business->menuItems()->where('is_available', true)->count(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function recentOrders(Business $business): array
    {
        return $business->orders()
            ->latest('placed_at')
            ->limit(8)
            ->get(['id', 'order_number', 'status', 'payment_status', 'total', 'placed_at'])
            ->toArray();
    }
}
