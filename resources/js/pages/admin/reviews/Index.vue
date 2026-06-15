<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import { dashboard } from '@/routes';

interface ReviewRow {
    id: string;
    rating: number;
    text: string | null;
    is_hidden: boolean;
    created_at: string | null;
    user: { id: string; name: string } | null;
    order: { id: string; order_number: string } | null;
}

defineProps<{
    reviews: { data: ReviewRow[]; links: Array<{ url: string | null; label: string; active: boolean }> };
    summary: { rating: string | number; review_count: number };
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Reviews', href: '/reviews' },
        ],
    },
});

const toggle = (review: ReviewRow) =>
    router.patch(`/reviews/${review.id}/hidden`, {}, { preserveScroll: true });
</script>

<template>
    <Head title="Reviews" />

    <div class="flex h-full flex-1 flex-col gap-4 p-4">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">Reviews</h1>
            <p class="text-sm text-muted-foreground">★ {{ Number(summary.rating).toFixed(1) }} · {{ summary.review_count }} public</p>
        </div>

        <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <table class="w-full text-sm">
                <thead class="text-left text-muted-foreground">
                    <tr>
                        <th class="p-3 font-medium">Customer</th>
                        <th class="p-3 font-medium">Rating</th>
                        <th class="p-3 font-medium">Comment</th>
                        <th class="p-3"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="review in reviews.data" :key="review.id" class="border-t border-sidebar-border/40" :class="review.is_hidden ? 'opacity-50' : ''">
                        <td class="p-3">
                            <div class="font-medium">{{ review.user?.name ?? '—' }}</div>
                            <div class="text-xs text-muted-foreground">{{ review.order?.order_number }}</div>
                        </td>
                        <td class="p-3 text-orange-500">{{ '★'.repeat(review.rating) }}</td>
                        <td class="p-3">{{ review.text ?? '—' }}</td>
                        <td class="p-3 text-right">
                            <button class="rounded-md border px-2 py-1 text-xs" @click="toggle(review)">
                                {{ review.is_hidden ? 'Unhide' : 'Hide' }}
                            </button>
                        </td>
                    </tr>
                    <tr v-if="reviews.data.length === 0">
                        <td class="p-4 text-center text-muted-foreground" colspan="4">No reviews yet.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="flex flex-wrap gap-1">
            <component
                :is="link.url ? 'a' : 'span'"
                v-for="link in reviews.links"
                :key="link.label"
                :href="link.url ?? undefined"
                class="rounded-md border px-3 py-1 text-sm"
                :class="[link.active ? 'bg-primary text-primary-foreground' : '', !link.url ? 'opacity-50' : '']"
                v-html="link.label"
            />
        </div>
    </div>
</template>
