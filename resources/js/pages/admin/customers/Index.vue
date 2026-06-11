<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { dashboard } from '@/routes';

interface CustomerRow {
    id: string;
    name: string;
    phone: string;
    order_count: number;
    total_spent: string | number | null;
}

defineProps<{
    customers: { data: CustomerRow[]; links: Array<{ url: string | null; label: string; active: boolean }> };
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Customers', href: '/customers' },
        ],
    },
});

const naira = (value: string | number | null) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value ?? 0));
</script>

<template>
    <Head title="Customers" />

    <div class="flex h-full flex-1 flex-col gap-4 p-4">
        <h1 class="text-2xl font-semibold">Customers</h1>

        <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <table class="w-full text-sm">
                <thead class="text-left text-muted-foreground">
                    <tr>
                        <th class="p-3 font-medium">Name</th>
                        <th class="p-3 font-medium">Phone</th>
                        <th class="p-3 text-right font-medium">Orders</th>
                        <th class="p-3 text-right font-medium">Total spent</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="customer in customers.data" :key="customer.id" class="border-t border-sidebar-border/40">
                        <td class="p-3">
                            <Link :href="`/customers/${customer.id}`" class="font-medium underline-offset-2 hover:underline">
                                {{ customer.name }}
                            </Link>
                        </td>
                        <td class="p-3">{{ customer.phone }}</td>
                        <td class="p-3 text-right">{{ customer.order_count }}</td>
                        <td class="p-3 text-right">{{ naira(customer.total_spent) }}</td>
                    </tr>
                    <tr v-if="customers.data.length === 0">
                        <td class="p-4 text-center text-muted-foreground" colspan="4">No customers yet.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
