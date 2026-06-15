<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import { computed, onMounted, ref, watch } from 'vue';

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: string | number;
    image_url: string | null;
    is_popular: boolean;
}

interface Category {
    id: string;
    name: string;
    emoji: string | null;
    menu_items: MenuItem[];
}

interface Kitchen {
    id: string;
    name: string;
    business_code: string;
    tagline: string | null;
    description: string | null;
    logo_url: string | null;
    cover_image_url: string | null;
    area: string | null;
    rating: string | number;
    review_count: number;
    prep_time_min: number | null;
    prep_time_max: number | null;
    cuisines: Array<{ id: string; name: string; emoji: string | null }>;
}

interface Review {
    id: string;
    rating: number;
    text: string | null;
    customer_name: string;
}

const props = defineProps<{ kitchen: Kitchen; categories: Category[]; reviews: Review[] }>();

const cartKey = `klinqo:cart:${props.kitchen.id}`;
const cart = ref<Record<string, { id: string; name: string; price: number; qty: number }>>({});

onMounted(() => {
    try {
        cart.value = JSON.parse(localStorage.getItem(cartKey) ?? '{}');
    } catch {
        cart.value = {};
    }
});

watch(cart, (value) => localStorage.setItem(cartKey, JSON.stringify(value)), { deep: true });

const add = (item: MenuItem) => {
    const existing = cart.value[item.id];
    cart.value[item.id] = {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        qty: (existing?.qty ?? 0) + 1,
    };
};

const decrement = (id: string) => {
    const existing = cart.value[id];
    if (!existing) return;
    if (existing.qty <= 1) {
        delete cart.value[id];
    } else {
        existing.qty -= 1;
    }
};

const qtyOf = (id: string) => cart.value[id]?.qty ?? 0;
const count = computed(() => Object.values(cart.value).reduce((sum, line) => sum + line.qty, 0));
const subtotal = computed(() => Object.values(cart.value).reduce((sum, line) => sum + line.price * line.qty, 0));

const naira = (value: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value));

const checkout = () => router.visit(`/s/${props.kitchen.business_code}/checkout`);
</script>

<template>
    <Head :title="kitchen.name" />

    <div class="min-h-screen bg-neutral-50 pb-24 text-neutral-900">
        <div class="relative h-40 w-full bg-neutral-200">
            <img v-if="kitchen.cover_image_url" :src="kitchen.cover_image_url" :alt="kitchen.name" class="h-full w-full object-cover" />
        </div>

        <div class="mx-auto max-w-xl px-4">
            <div class="-mt-8 rounded-2xl bg-white p-4 shadow">
                <h1 class="text-xl font-bold">{{ kitchen.name }}</h1>
                <p v-if="kitchen.tagline" class="text-sm text-neutral-500">{{ kitchen.tagline }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
                    <span>★ {{ Number(kitchen.rating).toFixed(1) }} ({{ kitchen.review_count }})</span>
                    <span v-if="kitchen.area">📍 {{ kitchen.area }}</span>
                    <span v-if="kitchen.prep_time_min">⏱ {{ kitchen.prep_time_min }}–{{ kitchen.prep_time_max }} min</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-1">
                    <span v-for="c in kitchen.cuisines" :key="c.id" class="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                        <span v-if="c.emoji">{{ c.emoji }} </span>{{ c.name }}
                    </span>
                </div>
            </div>

            <div v-for="category in categories" :key="category.id" class="mt-6">
                <h2 class="mb-2 font-semibold">
                    <span v-if="category.emoji">{{ category.emoji }} </span>{{ category.name }}
                </h2>
                <div class="space-y-3">
                    <div v-for="item in category.menu_items" :key="item.id" class="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                        <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="h-20 w-20 rounded-lg object-cover" />
                        <div class="flex flex-1 flex-col">
                            <div class="flex items-start justify-between">
                                <h3 class="font-medium">
                                    {{ item.name }}
                                    <span v-if="item.is_popular" class="ml-1 text-xs text-orange-500">★ Popular</span>
                                </h3>
                            </div>
                            <p v-if="item.description" class="line-clamp-2 text-sm text-neutral-500">{{ item.description }}</p>
                            <div class="mt-auto flex items-center justify-between pt-2">
                                <span class="font-semibold">{{ naira(item.price) }}</span>
                                <div v-if="qtyOf(item.id) > 0" class="flex items-center gap-2">
                                    <button class="h-7 w-7 rounded-full border" @click="decrement(item.id)">−</button>
                                    <span class="w-5 text-center">{{ qtyOf(item.id) }}</span>
                                    <button class="h-7 w-7 rounded-full bg-orange-500 text-white" @click="add(item)">+</button>
                                </div>
                                <button v-else class="rounded-lg bg-orange-500 px-3 py-1.5 text-sm text-white" @click="add(item)">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="reviews.length" class="mt-8">
                <h2 class="mb-2 font-semibold">Reviews</h2>
                <div class="space-y-3">
                    <div v-for="review in reviews" :key="review.id" class="rounded-xl bg-white p-3 shadow-sm">
                        <div class="flex items-center justify-between">
                            <span class="font-medium">{{ review.customer_name }}</span>
                            <span class="text-sm text-orange-500">{{ '★'.repeat(review.rating) }}</span>
                        </div>
                        <p v-if="review.text" class="mt-1 text-sm text-neutral-600">{{ review.text }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="count > 0" class="fixed inset-x-0 bottom-0 mx-auto max-w-xl p-3">
            <button
                class="flex w-full items-center justify-between rounded-xl bg-orange-500 px-5 py-3 font-medium text-white shadow-lg"
                @click="checkout"
            >
                <span>{{ count }} item{{ count > 1 ? 's' : '' }}</span>
                <span>Checkout · {{ naira(subtotal) }}</span>
            </button>
        </div>
    </div>
</template>
