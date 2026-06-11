<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import { onMounted, onUnmounted } from 'vue';
import { dashboard } from '@/routes';

interface OrderRow {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: string | number;
    placed_at: string | null;
    user: { id: string; name: string } | null;
}

const props = defineProps<{
    businessId: string;
    orders: { data: OrderRow[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: { status: string | null };
    statusCounts: Record<string, number>;
}>();

// Live incoming-orders feed. Requires Laravel Echo + Reverb to be configured;
// degrades gracefully (no-op) when broadcasting isn't wired up yet.
const echo = () => (window as unknown as { Echo?: any }).Echo;
const refresh = () => router.reload({ only: ['orders', 'statusCounts'] });

onMounted(() => {
    echo()
        ?.private(`orders.${props.businessId}`)
        .listen('.order.placed', refresh)
        .listen('.order.status', refresh);
});

onUnmounted(() => {
    echo()?.leave(`orders.${props.businessId}`);
});

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Orders', href: '/orders' },
        ],
    },
});

const statuses = ['placed', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];

const naira = (value: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value));
</script>

<template>
    <Head title="Orders" />

    <div class="flex h-full flex-1 flex-col gap-4 p-4">
        <h1 class="text-2xl font-semibold">Orders</h1>

        <div class="flex flex-wrap gap-2">
            <Link
                href="/orders"
                class="rounded-full border px-3 py-1 text-sm"
                :class="!filters.status ? 'bg-primary text-primary-foreground' : ''"
            >
                All
            </Link>
            <Link
                v-for="status in statuses"
                :key="status"
                :href="`/orders?status=${status}`"
                class="rounded-full border px-3 py-1 text-sm capitalize"
                :class="filters.status === status ? 'bg-primary text-primary-foreground' : ''"
            >
                {{ status }} ({{ statusCounts[status] ?? 0 }})
            </Link>
        </div>

        <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <table class="w-full text-sm">
                <thead class="text-left text-muted-foreground">
                    <tr>
                        <th class="p-3 font-medium">Order</th>
                        <th class="p-3 font-medium">Customer</th>
                        <th class="p-3 font-medium">Status</th>
                        <th class="p-3 font-medium">Payment</th>
                        <th class="p-3 text-right font-medium">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in orders.data" :key="order.id" class="border-t border-sidebar-border/40 hover:bg-muted/40">
                        <td class="p-3">
                            <Link :href="`/orders/${order.id}`" class="font-medium underline-offset-2 hover:underline">
                                {{ order.order_number }}
                            </Link>
                        </td>
                        <td class="p-3">{{ order.user?.name ?? '—' }}</td>
                        <td class="p-3 capitalize">{{ order.status }}</td>
                        <td class="p-3 capitalize">{{ order.payment_status }}</td>
                        <td class="p-3 text-right">{{ naira(order.total) }}</td>
                    </tr>
                    <tr v-if="orders.data.length === 0">
                        <td class="p-4 text-center text-muted-foreground" colspan="5">No orders.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="flex flex-wrap gap-1">
            <Link
                v-for="link in orders.links"
                :key="link.label"
                :href="link.url ?? ''"
                class="rounded-md border px-3 py-1 text-sm"
                :class="[link.active ? 'bg-primary text-primary-foreground' : '', !link.url ? 'pointer-events-none opacity-50' : '']"
                v-html="link.label"
            />
        </div>
    </div>
</template>
