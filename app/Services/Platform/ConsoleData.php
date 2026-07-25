<?php

namespace App\Services\Platform;

use App\Models\Business;
use App\Models\CommissionLedgerEntry;
use App\Models\Order;
use App\Models\PlatformSetting;
use App\Models\Review;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Builds the Savora Operations Console payload from real Klinqo data.
 *
 * The shape mirrors the design's mock dataset (resources/js/savora/data.ts)
 * so the Vue console renders identically on live data. Anything the schema
 * can't yet express (rider/agent, delivery time) is left as a sensible
 * placeholder rather than invented.
 */
class ConsoleData
{
    /** Kitchen card gradient palette (from the design). */
    private const PALETTE = [
        'linear-gradient(135deg,#FF6B35,#F7931E)',
        'linear-gradient(135deg,#6F4E37,#3E2723)',
        'linear-gradient(135deg,#2D7A4F,#1F5D3B)',
        'linear-gradient(135deg,#C2185B,#6A1B4A)',
        'linear-gradient(135deg,#D32F2F,#6F1A1A)',
        'linear-gradient(135deg,#F57C00,#BF5700)',
        'linear-gradient(135deg,#00897B,#00564D)',
        'linear-gradient(135deg,#5E35B1,#311B5E)',
    ];

    private const CAT_COLORS = ['#FF6B35', '#E0A100', '#D64545', '#1F8A5B', '#8A6FD6'];

    /**
     * @return array<string, mixed>
     */
    public static function for(User $admin): array
    {
        return (new self)->build($admin);
    }

    /**
     * @return array<string, mixed>
     */
    private function build(User $admin): array
    {
        $days = collect(range(13, 0))->map(fn (int $i) => today()->subDays($i));
        $dayRows = Order::query()
            ->where('placed_at', '>=', today()->subDays(13)->startOfDay())
            ->selectRaw('DATE(placed_at) d, count(*) c, '
                .'sum(case when payment_status = "paid" then total else 0 end) gmv, '
                .'sum(case when status = "delivered" then 1 else 0 end) delivered, '
                .'sum(case when payment_status = "refunded" then 1 else 0 end) refunded')
            ->groupBy('d')->get()->keyBy('d');

        $bucket = fn (CarbonInterface $d): array => (array) ($dayRows->get($d->toDateString()) ?? ['c' => 0, 'gmv' => 0, 'delivered' => 0, 'refunded' => 0]);

        $todayB = $bucket(today());
        $yestB = $bucket(today()->subDay());

        // Per-kitchen order aggregates.
        $ordAgg = Order::query()->toBase()
            ->selectRaw('business_id, count(*) c, sum(total) gmv, sum(commission_amount) comm')
            ->groupBy('business_id')->get()->keyBy('business_id');

        $businesses = Business::query()->orderByDesc('created_at')->get();
        $ledgerAgg = CommissionLedgerEntry::query()
            ->selectRaw('business_id, sum(case when status = "pending" then 1 else 0 end) pend, sum(case when status = "settled" then 1 else 0 end) settled')
            ->groupBy('business_id')->get()->keyBy('business_id');

        $colorOf = fn (string $id): string => self::PALETTE[abs(crc32($id)) % count(self::PALETTE)];

        return [
            'ADMIN_USER' => [
                'name' => $admin->name,
                'role' => 'Platform Operations',
                'email' => $admin->email ?? $admin->phone,
                'avatar' => $admin->avatar_url ?? '',
            ],
            'KPIS' => $this->kpis($dayRows, $days, $todayB, $yestB, $businesses),
            'SECONDARY' => $this->secondary($todayB, $yestB),
            'REVENUE_SERIES' => $days->map(fn (CarbonInterface $d) => [
                'day' => $d->format('M d'),
                'gmv' => round(((float) $bucket($d)['gmv']) / 1_000_000, 2),
                'orders' => (int) $bucket($d)['c'],
            ])->values()->all(),
            'CATEGORY_MIX' => $this->categoryMix(),
            'HOURLY' => $this->hourly(),
            'KITCHENS' => $businesses->map(fn (Business $b) => $this->kitchenRow($b, $ordAgg, $colorOf))->values()->all(),
            'ORDERS' => $this->orders($colorOf),
            'CUSTOMERS' => $this->customers(),
            'PAYOUTS' => $this->payouts($businesses, $ordAgg, $ledgerAgg),
            'ACTIVITY' => $this->activity(),
            'TEAM' => $this->team(),
            'FEES' => $this->fees(),
            'STATS' => $this->stats($todayB),
        ];
    }

    /**
     * @param  Collection<int|string, mixed>  $dayRows
     * @param  Collection<int, CarbonImmutable>  $days
     * @param  array<string, mixed>  $todayB
     * @param  array<string, mixed>  $yestB
     * @param  Collection<int, Business>  $businesses
     * @return array<int, array<string, mixed>>
     */
    private function kpis($dayRows, $days, array $todayB, array $yestB, $businesses): array
    {
        $bucket = fn (CarbonInterface $d): array => (array) ($dayRows->get($d->toDateString()) ?? ['c' => 0, 'gmv' => 0]);
        $gmvSpark = $days->map(fn (CarbonInterface $d) => round((float) $bucket($d)['gmv']));
        $ordSpark = $days->map(fn (CarbonInterface $d) => (int) $bucket($d)['c']);
        $aovSpark = $days->map(fn (CarbonInterface $d) => (int) $bucket($d)['c'] > 0 ? round((float) $bucket($d)['gmv'] / (int) $bucket($d)['c']) : 0);

        $gmvToday = (float) $todayB['gmv'];
        $gmvYest = (float) $yestB['gmv'];
        $ordToday = (int) $todayB['c'];
        $ordYest = (int) $yestB['c'];
        $aovToday = $ordToday > 0 ? $gmvToday / $ordToday : 0;
        $aovYest = $ordYest > 0 ? $gmvYest / $ordYest : 0;

        $active = $businesses->where('status', 'active')->count();
        $week = $businesses->where('created_at', '>=', now()->startOfWeek())->count();

        [$gmvD, $gmvDir] = $this->delta($gmvToday, $gmvYest);
        [$ordD, $ordDir] = $this->delta($ordToday, $ordYest);
        [$aovD, $aovDir] = $this->delta($aovToday, $aovYest);

        return [
            ['id' => 'gmv', 'label' => 'Gross merchandise value', 'value' => $this->compact($gmvToday), 'delta' => $gmvD, 'dir' => $gmvDir, 'spark' => $gmvSpark->all(), 'hint' => 'vs '.$this->compact($gmvYest).' yesterday'],
            ['id' => 'orders', 'label' => 'Orders today', 'value' => number_format($ordToday), 'delta' => $ordD, 'dir' => $ordDir, 'spark' => $ordSpark->all(), 'hint' => 'vs '.number_format($ordYest).' yesterday'],
            ['id' => 'kitchens', 'label' => 'Active kitchens', 'value' => (string) $active, 'delta' => $week, 'dir' => 'up', 'unit' => 'count', 'spark' => $ordSpark->all(), 'hint' => $week.' onboarded this week'],
            ['id' => 'aov', 'label' => 'Avg. order value', 'value' => $this->money($aovToday), 'delta' => $aovD, 'dir' => $aovDir, 'spark' => $aovSpark->all(), 'hint' => 'vs '.$this->money($aovYest).' yesterday'],
        ];
    }

    /**
     * @param  array<string, mixed>  $todayB
     * @param  array<string, mixed>  $yestB
     * @return array<int, array<string, mixed>>
     */
    private function secondary(array $todayB, array $yestB): array
    {
        $fulfilToday = (int) $todayB['c'] > 0 ? (int) $todayB['delivered'] / (int) $todayB['c'] * 100 : 0;
        $fulfilYest = (int) $yestB['c'] > 0 ? (int) $yestB['delivered'] / (int) $yestB['c'] * 100 : 0;
        $refundToday = (int) $todayB['c'] > 0 ? (int) $todayB['refunded'] / (int) $todayB['c'] * 100 : 0;
        $refundYest = (int) $yestB['c'] > 0 ? (int) $yestB['refunded'] / (int) $yestB['c'] * 100 : 0;

        $newToday = User::where('role', 'customer')->whereDate('created_at', today())->count();
        $newYest = User::where('role', 'customer')->whereDate('created_at', today()->subDay())->count();
        $avgRating = round((float) Review::query()->visible()->avg('rating'), 1);

        [$fD, $fDir] = $this->delta($fulfilToday, $fulfilYest);
        [$nD, $nDir] = $this->delta($newToday, $newYest);
        [$rD, $rDir] = $this->delta($refundToday, $refundYest);

        return [
            ['id' => 'fulfil', 'label' => 'Fulfilment rate', 'value' => round($fulfilToday, 1).'%', 'delta' => $fD, 'dir' => $fDir],
            ['id' => 'newcust', 'label' => 'New customers', 'value' => number_format($newToday), 'delta' => $nD, 'dir' => $nDir],
            ['id' => 'refunds', 'label' => 'Refund rate', 'value' => round($refundToday, 1).'%', 'delta' => $rD, 'dir' => $rDir, 'good' => 'down'],
            ['id' => 'rating', 'label' => 'Avg. rating', 'value' => $avgRating > 0 ? $avgRating.'★' : '—', 'delta' => 0, 'dir' => 'up'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function categoryMix(): array
    {
        $rows = DB::table('order_items')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->selectRaw('categories.name name, sum(order_items.total_price) total')
            ->groupBy('categories.name')->orderByDesc('total')->limit(5)->get();

        $sum = (float) $rows->sum('total');
        if ($sum <= 0) {
            return [['label' => 'No orders yet', 'value' => 100, 'color' => '#C8B5A8']];
        }

        return $rows->values()->map(fn ($r, int $i) => [
            'label' => $r->name,
            'value' => (int) round((float) $r->total / $sum * 100),
            'color' => self::CAT_COLORS[$i % count(self::CAT_COLORS)],
        ])->all();
    }

    /**
     * @return array<int, array{h: string, v: int}>
     */
    private function hourly(): array
    {
        $counts = Order::query()->whereDate('placed_at', today())
            ->selectRaw('HOUR(placed_at) h, count(*) c')->groupBy('h')->pluck('c', 'h');

        $label = function (int $h): string {
            $suffix = $h < 12 ? 'a' : 'p';
            $base = $h % 12 === 0 ? 12 : $h % 12;

            return $base.$suffix;
        };

        return collect(range(8, 21))->map(fn (int $h) => [
            'h' => $label($h),
            'v' => (int) ($counts[$h] ?? 0),
        ])->all();
    }

    /**
     * @param  Collection<int|string, \stdClass>  $ordAgg
     * @return array<string, mixed>
     */
    private function kitchenRow(Business $b, $ordAgg, callable $colorOf): array
    {
        $agg = (array) ($ordAgg->get($b->id) ?? []);
        $gmv = (float) ($agg['gmv'] ?? 0);
        $comm = (float) ($agg['comm'] ?? 0);
        $statusMap = ['active' => 'active', 'pending' => 'pending', 'suspended' => 'paused'];

        return [
            'id' => $b->id,
            'name' => $b->name,
            'code' => $b->business_code,
            'area' => $b->area ?? '—',
            'initial' => mb_strtoupper(mb_substr($b->name, 0, 1)),
            'color' => $colorOf($b->id),
            'rating' => (float) $b->rating,
            'orders' => (int) ($agg['c'] ?? 0),
            'gmv' => $this->compact($gmv),
            'gmvRaw' => round($gmv / 1_000_000, 2),
            'status' => $statusMap[$b->status] ?? 'pending',
            'commission' => (int) round($b->effectiveCommissionPercent()),
            'joined' => $b->created_at?->format('M Y') ?? '—',
            'payout' => $gmv > 0 ? $this->compact($gmv - $comm) : '—',
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function orders(callable $colorOf): array
    {
        $statusMap = [
            'placed' => 'preparing', 'confirmed' => 'preparing', 'preparing' => 'preparing',
            'ready' => 'ready', 'delivering' => 'enroute', 'delivered' => 'delivered', 'cancelled' => 'cancelled',
        ];
        $payMap = ['online' => 'Card', 'pay_on_delivery' => 'Cash', 'pay_on_pickup' => 'Cash'];

        return Order::query()
            ->with(['business:id,name,area', 'user:id,name'])
            ->withCount('items')
            ->orderByDesc('placed_at')->limit(12)->get()
            ->map(fn (Order $o) => [
                'id' => $o->order_number,
                'kitchen' => $o->business->name ?? '—',
                'code' => $o->business_id,
                'customer' => $o->user->name ?? '—',
                'items' => (int) $o->items_count,
                'total' => $this->money((float) $o->total),
                'totalRaw' => (float) $o->total,
                'status' => $statusMap[$o->status] ?? 'preparing',
                'pay' => $payMap[$o->payment_method] ?? 'Card',
                'area' => $o->business->area ?? '—',
                'time' => $o->placed_at?->diffForHumans() ?? '—',
                'agent' => '—',
            ])->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function customers(): array
    {
        $agg = Order::query()->toBase()
            ->selectRaw('user_id, count(*) c, sum(total) s, max(placed_at) last')
            ->groupBy('user_id')->get()->keyBy('user_id')
            ->sortByDesc('s')->take(8);

        if ($agg->isEmpty()) {
            return [];
        }

        $users = User::query()->whereIn('id', $agg->keys())->get()->keyBy('id');

        // Latest order area per top customer (small N).
        $areas = Order::query()->whereIn('user_id', $agg->keys())
            ->with('business:id,area')->orderByDesc('placed_at')->get()
            ->groupBy('user_id')->map(fn ($g) => $g->first()->business->area ?? '—');

        return $agg->map(function ($a, string $uid) use ($users, $areas) {
            $u = $users->get($uid);
            if (! $u) {
                return null;
            }
            $spend = (float) $a->s;
            $orders = (int) $a->c;
            $tier = $spend >= 200_000 ? 'VIP' : ($orders <= 3 ? 'New' : 'Regular');

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email ?? $u->phone,
                'avatar' => $u->avatar_url ?? '',
                'orders' => $orders,
                'spend' => $this->compact($spend),
                'spendRaw' => $spend,
                'area' => $areas[$uid] ?? '—',
                'tier' => $tier,
                'last' => Carbon::parse($a->last)->diffForHumans(),
            ];
        })->filter()->values()->all();
    }

    /**
     * @param  Collection<int, Business>  $businesses
     * @param  Collection<int|string, \stdClass>  $ordAgg
     * @param  Collection<int|string, mixed>  $ledgerAgg
     * @return array<int, array<string, mixed>>
     */
    private function payouts($businesses, $ordAgg, $ledgerAgg): array
    {
        $rows = [];
        $i = 1042;
        foreach ($businesses->sortByDesc(fn (Business $b) => (float) (((array) ($ordAgg->get($b->id) ?? []))['gmv'] ?? 0)) as $b) {
            $agg = (array) ($ordAgg->get($b->id) ?? []);
            $gross = (float) ($agg['gmv'] ?? 0);
            if ($gross <= 0) {
                continue;
            }
            $comm = (float) ($agg['comm'] ?? 0);
            $ledger = $ledgerAgg->get($b->id);
            $status = ($ledger && (int) $ledger->pend > 0) ? 'pending' : (($ledger && (int) $ledger->settled > 0) ? 'paid' : 'pending');

            $rows[] = [
                'id' => 'PO-'.$i--,
                'kitchen' => $b->name,
                'code' => $b->id,
                'period' => 'All-time',
                'gross' => $this->compact($gross),
                'commission' => $this->compact($comm),
                'net' => $this->compact($gross - $comm),
                'status' => $status,
                'date' => $status === 'paid' ? ($b->updated_at?->format('M j') ?? '—') : '—',
            ];
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function activity(): array
    {
        $out = [];

        foreach (Business::query()->where('status', 'pending')->latest()->limit(3)->get() as $b) {
            $out[] = ['id' => 'k'.$b->id, 'icon' => 'store', 'tone' => 'warn', 'text' => "New kitchen {$b->name} submitted for review", 'time' => $b->created_at?->diffForHumans() ?? ''];
        }

        foreach (Review::query()->visible()->with('business:id,name')->latest()->limit(2)->get() as $r) {
            $out[] = ['id' => 'r'.$r->id, 'icon' => 'star', 'tone' => 'good', 'text' => ($r->business->name ?? 'A kitchen')." received a {$r->rating}★ review", 'time' => $r->created_at?->diffForHumans() ?? ''];
        }

        $newToday = User::where('role', 'customer')->whereDate('created_at', today())->count();
        if ($newToday > 0) {
            $out[] = ['id' => 'newc', 'icon' => 'user', 'tone' => 'neutral', 'text' => number_format($newToday).' new customers onboarded today', 'time' => 'today'];
        }

        return array_slice($out, 0, 5);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function team(): array
    {
        return User::query()->where('role', 'admin')->orderBy('created_at')->limit(8)->get()
            ->map(fn (User $u, int $i) => [
                'name' => $u->name,
                'role' => $i === 0 ? 'Owner' : 'Operations',
                'email' => $u->email ?? $u->phone,
                'avatar' => $u->avatar_url ?? '',
            ])->all();
    }

    /**
     * @return array<int, array{label: string, value: string}>
     */
    private function fees(): array
    {
        $s = PlatformSetting::current();

        return [
            ['label' => 'Default commission', 'value' => round((float) $s->default_commission_percent).'%'],
            ['label' => 'Support phone', 'value' => $s->support_phone ?: '—'],
            ['label' => 'Support email', 'value' => $s->support_email ?: '—'],
        ];
    }

    /**
     * @param  array<string, mixed>  $todayB
     * @return array<string, mixed>
     */
    private function stats(array $todayB): array
    {
        $totalCustomers = User::where('role', 'customer')->count();
        $repeat = User::where('role', 'customer')->has('orders', '>', 1)->count();
        $withOrders = User::where('role', 'customer')->has('orders')->count();
        $vip = DB::query()->fromSub(
            Order::query()->selectRaw('user_id')->groupBy('user_id')->havingRaw('sum(total) >= 200000'),
            'vip'
        )->count();

        return [
            'orders_today' => number_format((int) $todayB['c']),
            'customers_total' => number_format($totalCustomers),
            'new_today' => number_format(User::where('role', 'customer')->whereDate('created_at', today())->count()),
            'vip_segment' => number_format($vip),
            'repeat_rate' => ($withOrders > 0 ? round($repeat / $withOrders * 100) : 0).'%',
        ];
    }

    // ── formatting helpers ───────────────────────────────────────

    private function money(float $n): string
    {
        return '₦'.number_format($n);
    }

    private function compact(float $n): string
    {
        if ($n >= 1_000_000) {
            return '₦'.rtrim(rtrim(number_format($n / 1_000_000, 2, '.', ''), '0'), '.').'M';
        }
        if ($n >= 1_000) {
            return '₦'.round($n / 1_000).'K';
        }

        return '₦'.number_format($n);
    }

    /**
     * @return array{0: float, 1: string}
     */
    private function delta(float $current, float $previous): array
    {
        if ($previous <= 0) {
            return [$current > 0 ? 100.0 : 0.0, 'up'];
        }
        $pct = round(($current - $previous) / $previous * 100, 1);

        return [abs($pct), $pct >= 0 ? 'up' : 'down'];
    }
}
