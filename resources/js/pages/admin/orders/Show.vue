<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import { computed } from 'vue';
import { dashboard } from '@/routes';

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    unit_price: string | number;
    total_price: string | number;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    payment_method: string;
    delivery_type: string;
    subtotal: string | number;
    delivery_fee: string | number;
    total: string | number;
    note: string | null;
    items: OrderItem[];
    user: { id: string; name: string; phone: string } | null;
    address: { address_line: string; phone: string } | null;
    delivery_method: { name: string } | null;
}

const props = defineProps<{ order: Order }>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Orders', href: '/orders' },
            { title: 'Order', href: '#' },
        ],
    },
});

const transitions: Record<string, string[]> = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivering', 'delivered', 'cancelled'],
    delivering: ['delivered'],
    delivered: [],
    cancelled: [],
};

const nextStatuses = computed(() => transitions[props.order.status] ?? []);

const naira = (value: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value));

const advance = (status: string) =>
    router.post(`/orders/${props.order.id}/status`, { status }, { preserveScroll: true });
</script>

<template>
    <Head :title="`Order ${order.order_number}`" />

    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-semibold">{{ order.order_number }}</h1>
                <p class="text-sm capitalize text-muted-foreground">
                    {{ order.status }} · {{ order.payment_status }} · {{ order.delivery_type }}
                </p>
            </div>
        </div>

        <div v-if="nextStatuses.length" class="flex flex-wrap gap-2">
            <button
                v-for="status in nextStatuses"
                :key="status"
                class="rounded-md border px-4 py-2 text-sm capitalize"
                :class="status === 'cancelled' ? 'text-red-600' : 'bg-primary text-primary-foreground'"
                @click="advance(status)"
            >
                Mark {{ status }}
            </button>
        </div>

        <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <table class="w-full text-sm">
                <tbody>
                    <tr v-for="item in order.items" :key="item.id" class="border-b border-sidebar-border/40">
                        <td class="p-3">{{ item.quantity }} × {{ item.name }}</td>
                        <td class="p-3 text-right">{{ naira(item.total_price) }}</td>
                    </tr>
                    <tr>
                        <td class="p-3 text-muted-foreground">Subtotal</td>
                        <td class="p-3 text-right">{{ naira(order.subtotal) }}</td>
                    </tr>
                    <tr>
                        <td class="p-3 text-muted-foreground">Delivery</td>
                        <td class="p-3 text-right">{{ naira(order.delivery_fee) }}</td>
                    </tr>
                    <tr class="font-semibold">
                        <td class="p-3">Total</td>
                        <td class="p-3 text-right">{{ naira(order.total) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="rounded-xl border border-sidebar-border/70 p-4 text-sm dark:border-sidebar-border">
            <p><span class="text-muted-foreground">Customer:</span> {{ order.user?.name }} ({{ order.user?.phone }})</p>
            <p v-if="order.address"><span class="text-muted-foreground">Address:</span> {{ order.address.address_line }}</p>
            <p v-if="order.delivery_method"><span class="text-muted-foreground">Method:</span> {{ order.delivery_method.name }}</p>
            <p v-if="order.note"><span class="text-muted-foreground">Note:</span> {{ order.note }}</p>
        </div>
    </div>
</template>
