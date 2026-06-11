<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\OrderItem;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    use ResolvesCurrentBusiness;

    public function index(Request $request): Response
    {
        $business = $this->requireBusiness($request);
        [$from, $to] = $this->range($request);

        $paid = fn () => $business->orders()
            ->where('payment_status', 'paid')
            ->whereBetween('placed_at', [$from, $to]);

        $ordersCount = $business->orders()->whereBetween('placed_at', [$from, $to])->count();
        $revenue = (float) $paid()->sum('total');
        $paidCount = $paid()->count();

        return Inertia::render('admin/Reports', [
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'summary' => [
                'orders' => $ordersCount,
                'revenue' => $revenue,
                'average_order_value' => $paidCount > 0 ? round($revenue / $paidCount, 2) : 0,
            ],
            'revenueByDay' => $paid()
                ->selectRaw('date(placed_at) as day, sum(total) as revenue, count(*) as orders')
                ->groupBy('day')
                ->orderBy('day')
                ->get(),
            'topItems' => $this->topItems($business, $from, $to),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $business = $this->requireBusiness($request);
        [$from, $to] = $this->range($request);

        $orders = $business->orders()
            ->whereBetween('placed_at', [$from, $to])
            ->latest('placed_at')
            ->get(['order_number', 'status', 'payment_status', 'payment_method', 'subtotal', 'delivery_fee', 'total', 'commission_amount', 'placed_at']);

        return response()->streamDownload(function () use ($orders) {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, ['Order', 'Status', 'Payment', 'Method', 'Subtotal', 'Delivery', 'Total', 'Commission', 'Placed at']);

            foreach ($orders as $order) {
                fputcsv($handle, [
                    $order->order_number,
                    $order->status,
                    $order->payment_status,
                    $order->payment_method,
                    $order->subtotal,
                    $order->delivery_fee,
                    $order->total,
                    $order->commission_amount,
                    optional($order->placed_at)->toDateTimeString(),
                ]);
            }

            fclose($handle);
        }, 'orders-'.$from->toDateString().'-to-'.$to->toDateString().'.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function range(Request $request): array
    {
        $to = $this->parseDate($request->query('to')) ?? CarbonImmutable::today();
        $from = $this->parseDate($request->query('from')) ?? $to->subDays(13);

        return [$from->startOfDay(), $to->endOfDay()];
    }

    private function parseDate(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @return Collection<int, OrderItem>
     */
    private function topItems(Business $business, CarbonImmutable $from, CarbonImmutable $to)
    {
        return OrderItem::query()
            ->whereHas('order', fn (Builder $q) => $q
                ->where('business_id', $business->id)
                ->whereBetween('placed_at', [$from, $to]))
            ->selectRaw('name, sum(quantity) as quantity, sum(total_price) as revenue')
            ->groupBy('name')
            ->orderByDesc('quantity')
            ->limit(10)
            ->get();
    }
}
