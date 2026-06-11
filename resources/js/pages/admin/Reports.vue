<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import { reactive } from 'vue';
import { dashboard } from '@/routes';

interface DayRow { day: string; revenue: string | number; orders: number }
interface ItemRow { name: string; quantity: number; revenue: string | number }

const props = defineProps<{
    range: { from: string; to: string };
    summary: { orders: number; revenue: string | number; average_order_value: string | number };
    revenueByDay: DayRow[];
    topItems: ItemRow[];
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Reports', href: '/reports' },
        ],
    },
});

const filters = reactive({ from: props.range.from, to: props.range.to });

const naira = (value: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value));

const apply = () => router.get('/reports', { ...filters }, { preserveState: true });
</script>

<template>
    <Head title="Reports" />

    <div class="flex h-full flex-1 flex-col gap-6 p-4">
        <div class="flex flex-wrap items-end justify-between gap-3">
            <h1 class="text-2xl font-semibold">Reports</h1>
            <form class="flex items-end gap-2" @submit.prevent="apply">
                <label class="flex flex-col text-xs text-muted-foreground">
                    From<input v-model="filters.from" type="date" class="rounded-md border px-2 py-1" />
                </label>
                <label class="flex flex-col text-xs text-muted-foreground">
                    To<input v-model="filters.to" type="date" class="rounded-md border px-2 py-1" />
                </label>
                <button class="rounded-md border px-3 py-1.5 text-sm">Apply</button>
                <a
                    :href="`/reports/export?from=${filters.from}&to=${filters.to}`"
                    class="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                >
                    Export CSV
                </a>
            </form>
        </div>

        <div class="grid auto-rows-min gap-4 md:grid-cols-3">
            <div class="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                <p class="text-sm text-muted-foreground">Orders</p>
                <p class="mt-1 text-2xl font-semibold">{{ summary.orders }}</p>
            </div>
            <div class="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                <p class="text-sm text-muted-foreground">Revenue (paid)</p>
                <p class="mt-1 text-2xl font-semibold">{{ naira(summary.revenue) }}</p>
            </div>
            <div class="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                <p class="text-sm text-muted-foreground">Avg order value</p>
                <p class="mt-1 text-2xl font-semibold">{{ naira(summary.average_order_value) }}</p>
            </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
            <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                <div class="border-b border-sidebar-border/70 p-3 font-medium dark:border-sidebar-border">Revenue by day</div>
                <table class="w-full text-sm">
                    <tbody>
                        <tr v-for="row in revenueByDay" :key="row.day" class="border-t border-sidebar-border/40">
                            <td class="p-3">{{ row.day }}</td>
                            <td class="p-3 text-right">{{ row.orders }} orders</td>
                            <td class="p-3 text-right">{{ naira(row.revenue) }}</td>
                        </tr>
                        <tr v-if="revenueByDay.length === 0">
                            <td class="p-4 text-center text-muted-foreground" colspan="3">No paid orders in range.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                <div class="border-b border-sidebar-border/70 p-3 font-medium dark:border-sidebar-border">Top items</div>
                <table class="w-full text-sm">
                    <tbody>
                        <tr v-for="row in topItems" :key="row.name" class="border-t border-sidebar-border/40">
                            <td class="p-3">{{ row.name }}</td>
                            <td class="p-3 text-right">{{ row.quantity }} sold</td>
                            <td class="p-3 text-right">{{ naira(row.revenue) }}</td>
                        </tr>
                        <tr v-if="topItems.length === 0">
                            <td class="p-4 text-center text-muted-foreground" colspan="3">No sales in range.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>
