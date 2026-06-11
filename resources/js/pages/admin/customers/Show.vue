<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { dashboard } from '@/routes';

interface OrderRow {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: string | number;
    placed_at: string | null;
}

defineProps<{
    customer: { id: string; name: string; phone: string; email: string | null };
    orders: OrderRow[];
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Customers', href: '/customers' },
            { title: 'Customer', href: '#' },
        ],
    },
});

const naira = (value: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value));
</script>

<template>
    <Head :title="customer.name" />

    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
        <div>
            <h1 class="text-2xl font-semibold">{{ customer.name }}</h1>
            <p class="text-sm text-muted-foreground">{{ customer.phone }}<span v-if="customer.email"> · {{ customer.email }}</span></p>
        </div>

        <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <table class="w-full text-sm">
                <thead class="text-left text-muted-foreground">
                    <tr>
                        <th class="p-3 font-medium">Order</th>
                        <th class="p-3 font-medium">Status</th>
                        <th class="p-3 text-right font-medium">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="order in orders" :key="order.id" class="border-t border-sidebar-border/40">
                        <td class="p-3">
                            <Link :href="`/orders/${order.id}`" class="font-medium underline-offset-2 hover:underline">
                                {{ order.order_number }}
                            </Link>
                        </td>
                        <td class="p-3 capitalize">{{ order.status }}</td>
                        <td class="p-3 text-right">{{ naira(order.total) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
