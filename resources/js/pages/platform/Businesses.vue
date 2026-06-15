<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';

interface Owner { id: string; name: string; phone: string }
interface BusinessRow {
    id: string;
    name: string;
    business_code: string;
    status: string;
    area: string | null;
    commission_percent: string | number | null;
    paystack_subaccount_code: string | null;
    owner: Owner | null;
}

defineProps<{
    businesses: { data: BusinessRow[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    filters: { status: string };
    statusCounts: Record<string, number>;
}>();

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Platform · Kitchens', href: '/platform/businesses' }],
    },
});

const statuses = ['pending', 'active', 'suspended'];

const approve = (b: BusinessRow) => router.post(`/platform/businesses/${b.id}/approve`, {}, { preserveScroll: true });
const suspend = (b: BusinessRow) => router.post(`/platform/businesses/${b.id}/suspend`, {}, { preserveScroll: true });
const reactivate = (b: BusinessRow) => router.post(`/platform/businesses/${b.id}/reactivate`, {}, { preserveScroll: true });

const setCommission = (b: BusinessRow) => {
    const input = window.prompt('Commission % for this kitchen (blank = platform default):', String(b.commission_percent ?? ''));
    if (input === null) return;
    router.patch(
        `/platform/businesses/${b.id}/commission`,
        { commission_percent: input === '' ? null : Number(input) },
        { preserveScroll: true },
    );
};
</script>

<template>
    <Head title="Kitchens" />

    <div class="flex h-full flex-1 flex-col gap-4 p-4">
        <h1 class="text-2xl font-semibold">Kitchens</h1>

        <div class="flex flex-wrap gap-2">
            <Link
                v-for="status in statuses"
                :key="status"
                :href="`/platform/businesses?status=${status}`"
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
                        <th class="p-3 font-medium">Kitchen</th>
                        <th class="p-3 font-medium">Owner</th>
                        <th class="p-3 font-medium">Payout</th>
                        <th class="p-3 font-medium">Commission</th>
                        <th class="p-3"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="b in businesses.data" :key="b.id" class="border-t border-sidebar-border/40">
                        <td class="p-3">
                            <div class="font-medium">{{ b.name }}</div>
                            <div class="text-xs text-muted-foreground">{{ b.business_code }} · {{ b.area }}</div>
                        </td>
                        <td class="p-3">
                            <div>{{ b.owner?.name }}</div>
                            <div class="text-xs text-muted-foreground">{{ b.owner?.phone }}</div>
                        </td>
                        <td class="p-3">
                            <span :class="b.paystack_subaccount_code ? 'text-green-600' : 'text-muted-foreground'">
                                {{ b.paystack_subaccount_code ? 'Linked' : 'Not linked' }}
                            </span>
                        </td>
                        <td class="p-3">
                            <button class="underline" @click="setCommission(b)">
                                {{ b.commission_percent !== null ? `${b.commission_percent}%` : 'Default' }}
                            </button>
                        </td>
                        <td class="p-3 text-right">
                            <button v-if="b.status === 'pending'" class="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground" @click="approve(b)">
                                Approve
                            </button>
                            <button v-else-if="b.status === 'active'" class="rounded-md border px-3 py-1 text-xs text-red-600" @click="suspend(b)">
                                Suspend
                            </button>
                            <button v-else class="rounded-md border px-3 py-1 text-xs" @click="reactivate(b)">
                                Reactivate
                            </button>
                        </td>
                    </tr>
                    <tr v-if="businesses.data.length === 0">
                        <td class="p-4 text-center text-muted-foreground" colspan="5">No kitchens.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
