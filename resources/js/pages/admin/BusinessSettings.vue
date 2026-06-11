<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3';
import { dashboard } from '@/routes';

interface BusinessData {
    name: string;
    tagline: string | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    area: string | null;
    prep_time_min: number | null;
    prep_time_max: number | null;
    accepts_online: boolean;
    accepts_on_delivery: boolean;
    accepts_on_pickup: boolean;
    logo_url: string | null;
    cover_image_url: string | null;
}

const props = defineProps<{
    business: BusinessData;
    allCuisines: Array<{ id: string; name: string; emoji: string | null }>;
    selectedCuisines: string[];
}>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Settings', href: '/business/settings' },
        ],
    },
});

const form = useForm<{
    name: string;
    tagline: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    area: string;
    prep_time_min: number | null;
    prep_time_max: number | null;
    accepts_online: boolean;
    accepts_on_delivery: boolean;
    accepts_on_pickup: boolean;
    cuisines: string[];
    logo: File | null;
    cover: File | null;
}>({
    name: props.business.name ?? '',
    tagline: props.business.tagline ?? '',
    description: props.business.description ?? '',
    phone: props.business.phone ?? '',
    email: props.business.email ?? '',
    address: props.business.address ?? '',
    area: props.business.area ?? '',
    prep_time_min: props.business.prep_time_min,
    prep_time_max: props.business.prep_time_max,
    accepts_online: props.business.accepts_online,
    accepts_on_delivery: props.business.accepts_on_delivery,
    accepts_on_pickup: props.business.accepts_on_pickup,
    cuisines: [...props.selectedCuisines],
    logo: null,
    cover: null,
});

const submit = () => form.put('/business/settings', { forceFormData: true, preserveScroll: true });

const toggleCuisine = (id: string) => {
    const i = form.cuisines.indexOf(id);
    if (i === -1) {
        form.cuisines.push(id);
    } else {
        form.cuisines.splice(i, 1);
    }
};
</script>

<template>
    <Head title="Business settings" />

    <form class="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4" @submit.prevent="submit">
        <h1 class="text-2xl font-semibold">Business settings</h1>

        <div class="grid gap-4 md:grid-cols-2">
            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Name</span>
                <input v-model="form.name" class="rounded-md border px-3 py-2" />
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Tagline</span>
                <input v-model="form.tagline" class="rounded-md border px-3 py-2" />
            </label>
            <label class="flex flex-col gap-1 md:col-span-2">
                <span class="text-xs text-muted-foreground">Description</span>
                <textarea v-model="form.description" rows="3" class="rounded-md border px-3 py-2"></textarea>
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Phone</span>
                <input v-model="form.phone" class="rounded-md border px-3 py-2" />
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Email</span>
                <input v-model="form.email" class="rounded-md border px-3 py-2" />
            </label>
            <label class="flex flex-col gap-1 md:col-span-2">
                <span class="text-xs text-muted-foreground">Address</span>
                <input v-model="form.address" class="rounded-md border px-3 py-2" />
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Area</span>
                <input v-model="form.area" class="rounded-md border px-3 py-2" />
            </label>
        </div>

        <fieldset class="flex flex-wrap gap-4 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <legend class="px-1 text-sm font-medium">Payment options</legend>
            <label class="flex items-center gap-2"><input v-model="form.accepts_online" type="checkbox" /> Online</label>
            <label class="flex items-center gap-2"><input v-model="form.accepts_on_delivery" type="checkbox" /> Pay on delivery</label>
            <label class="flex items-center gap-2"><input v-model="form.accepts_on_pickup" type="checkbox" /> Pay on pickup</label>
        </fieldset>

        <fieldset class="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
            <legend class="px-1 text-sm font-medium">Cuisines</legend>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="cuisine in props.allCuisines"
                    :key="cuisine.id"
                    type="button"
                    class="rounded-full border px-3 py-1 text-sm"
                    :class="form.cuisines.includes(cuisine.id) ? 'bg-primary text-primary-foreground' : ''"
                    @click="toggleCuisine(cuisine.id)"
                >
                    <span v-if="cuisine.emoji">{{ cuisine.emoji }} </span>{{ cuisine.name }}
                </button>
            </div>
        </fieldset>

        <div class="grid gap-4 md:grid-cols-2">
            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Logo</span>
                <input type="file" accept="image/*" @input="form.logo = ($event.target as HTMLInputElement).files?.[0] ?? null" />
            </label>
            <label class="flex flex-col gap-1">
                <span class="text-xs text-muted-foreground">Cover image</span>
                <input type="file" accept="image/*" @input="form.cover = ($event.target as HTMLInputElement).files?.[0] ?? null" />
            </label>
        </div>

        <div>
            <button class="rounded-md bg-primary px-5 py-2 text-primary-foreground" :disabled="form.processing">
                Save changes
            </button>
        </div>
    </form>
</template>
