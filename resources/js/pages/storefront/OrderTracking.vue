<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import { onMounted, onUnmounted } from 'vue';

interface OrderItem { id: string; name: string; quantity: number; total_price: string | number }
interface Order {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    delivery_type: string;
    user_id: string;
    subtotal: string | number;
    delivery_fee: string | number;
    total: string | number;
    items: OrderItem[];
    business: { name: string; business_code: string } | null;
}

const props = defineProps<{
    order: Order;
    steps: Array<{ status: string; reached: boolean; current: boolean }>;
}>();

const naira = (v: string | number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(v));

// Live status updates via Echo (falls back to nothing if Reverb isn't running).
const echo = () => (window as unknown as { Echo?: any }).Echo;
const refresh = () => router.reload({ only: ['order', 'steps'] });

onMounted(() => {
    echo()?.private(`users.${props.order.user_id}`).listen('.order.status', refresh);
});
onUnmounted(() => {
    echo()?.leave(`users.${props.order.user_id}`);
});
</script>

<template>
    <Head :title="`Order ${order.order_number}`" />

    <div class="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-900">
        <div class="mx-auto max-w-xl">
            <div class="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p class="text-sm text-neutral-500">{{ order.business?.name }}</p>
                <h1 class="text-2xl font-bold">{{ order.order_number }}</h1>
                <p class="mt-1 text-sm capitalize text-neutral-600">
                    {{ order.status }} · {{ order.payment_status }} · {{ order.delivery_type }}
                </p>
            </div>

            <ol class="mt-6 space-y-3">
                <li v-for="step in steps" :key="step.status" class="flex items-center gap-3">
                    <span
                        class="flex h-6 w-6 items-center justify-center rounded-full text-xs"
                        :class="step.reached ? 'bg-orange-500 text-white' : 'bg-neutral-200 text-neutral-500'"
                    >
                        {{ step.reached ? '✓' : '' }}
                    </span>
                    <span class="capitalize" :class="step.current ? 'font-semibold' : ''">{{ step.status }}</span>
                </li>
            </ol>

            <div class="mt-6 rounded-xl bg-white p-4 shadow-sm">
                <div v-for="item in order.items" :key="item.id" class="flex justify-between py-1 text-sm">
                    <span>{{ item.quantity }} × {{ item.name }}</span>
                    <span>{{ naira(item.total_price) }}</span>
                </div>
                <div class="mt-2 flex justify-between border-t pt-2 text-sm">
                    <span>Delivery</span><span>{{ naira(order.delivery_fee) }}</span>
                </div>
                <div class="mt-1 flex justify-between font-semibold">
                    <span>Total</span><span>{{ naira(order.total) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
