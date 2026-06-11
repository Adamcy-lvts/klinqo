<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import { dashboard } from '@/routes';

interface BusinessSummary {
    id: string;
    name: string;
    status: string;
    business_code: string;
}

interface Metrics {
    orders_today: number;
    revenue_today: number;
    pending_orders: number;
    active_items: number;
}

interface RecentOrder {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: string | number;
    placed_at: string | null;
}

defineProps<{
    business: BusinessSummary | null;
    metrics: Metrics | null;
    recentOrders: RecentOrder[];
}>();

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
    },
});

const naira = (value: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value));
</script>

<template>
    <Head title="Dashboard" />

    <div class="flex h-full flex-1 flex-col gap-6 p-4">
        <template v-if="business">
            <div>
                <h1 class="text-2xl font-semibold">{{ business.name }}</h1>
                <p class="text-sm text-muted-foreground">
                    Code {{ business.business_code }} · {{ business.status }}
                </p>
            </div>

            <div v-if="metrics" class="grid auto-rows-min gap-4 md:grid-cols-4">
                <div class="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <p class="text-sm text-muted-foreground">Orders today</p>
                    <p class="mt-1 text-2xl font-semibold">{{ metrics.orders_today }}</p>
                </div>
                <div class="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <p class="text-sm text-muted-foreground">Revenue today</p>
                    <p class="mt-1 text-2xl font-semibold">{{ naira(metrics.revenue_today) }}</p>
                </div>
                <div class="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <p class="text-sm text-muted-foreground">Pending orders</p>
                    <p class="mt-1 text-2xl font-semibold">{{ metrics.pending_orders }}</p>
                </div>
                <div class="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <p class="text-sm text-muted-foreground">Active items</p>
                    <p class="mt-1 text-2xl font-semibold">{{ metrics.active_items }}</p>
                </div>
            </div>

            <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                <div class="border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h2 class="font-medium">Recent orders</h2>
                </div>
                <table class="w-full text-sm">
                    <thead class="text-left text-muted-foreground">
                        <tr>
                            <th class="p-3 font-medium">Order</th>
                            <th class="p-3 font-medium">Status</th>
                            <th class="p-3 font-medium">Payment</th>
                            <th class="p-3 text-right font-medium">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in recentOrders" :key="order.id" class="border-t border-sidebar-border/40">
                            <td class="p-3 font-medium">{{ order.order_number }}</td>
                            <td class="p-3 capitalize">{{ order.status }}</td>
                            <td class="p-3 capitalize">{{ order.payment_status }}</td>
                            <td class="p-3 text-right">{{ naira(order.total) }}</td>
                        </tr>
                        <tr v-if="recentOrders.length === 0">
                            <td class="p-4 text-center text-muted-foreground" colspan="4">No orders yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </template>

        <div v-else class="rounded-xl border border-dashed p-10 text-center">
            <h1 class="text-xl font-semibold">Set up your kitchen</h1>
            <p class="mt-2 text-sm text-muted-foreground">
                You don't have a kitchen yet. Onboarding will let you create one.
            </p>
        </div>
    </div>
</template>
