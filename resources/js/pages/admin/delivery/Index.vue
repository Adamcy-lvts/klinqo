<script setup lang="ts">
import { Head, router, useForm } from '@inertiajs/vue3';
import { dashboard } from '@/routes';

interface DeliveryMethod {
    id: string;
    name: string;
    description: string | null;
    fee: string | number;
    is_active: boolean;
}

const props = defineProps<{ deliveryMethods: DeliveryMethod[] }>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Delivery methods', href: '/delivery-methods' },
        ],
    },
});

const naira = (value: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value));

const form = useForm({ name: '', description: '', fee: '' });

const submit = () =>
    form.post('/delivery-methods', {
        preserveScroll: true,
        onSuccess: () => form.reset(),
    });

const toggleActive = (method: DeliveryMethod) =>
    router.put(
        `/delivery-methods/${method.id}`,
        { name: method.name, fee: method.fee, is_active: !method.is_active },
        { preserveScroll: true },
    );

const remove = (id: string) => {
    if (confirm('Delete this delivery method?')) {
        router.delete(`/delivery-methods/${id}`, { preserveScroll: true });
    }
};
</script>

<template>
    <Head title="Delivery methods" />

    <div class="flex h-full flex-1 flex-col gap-6 p-4">
        <h1 class="text-2xl font-semibold">Delivery methods</h1>

        <form
            class="flex flex-wrap items-end gap-3 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
            @submit.prevent="submit"
        >
            <div class="flex flex-col">
                <label class="text-xs text-muted-foreground">Name</label>
                <input v-model="form.name" class="rounded-md border px-3 py-2" placeholder="Standard Delivery" />
            </div>
            <div class="flex flex-col">
                <label class="text-xs text-muted-foreground">Description</label>
                <input v-model="form.description" class="rounded-md border px-3 py-2" placeholder="Within Ikeja, 30-60 mins" />
            </div>
            <div class="flex flex-col">
                <label class="text-xs text-muted-foreground">Fee (₦)</label>
                <input v-model="form.fee" type="number" step="0.01" class="w-28 rounded-md border px-3 py-2" />
            </div>
            <button class="rounded-md bg-primary px-4 py-2 text-primary-foreground" :disabled="form.processing">Add</button>
        </form>

        <div class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
            <table class="w-full text-sm">
                <thead class="text-left text-muted-foreground">
                    <tr>
                        <th class="p-3 font-medium">Name</th>
                        <th class="p-3 font-medium">Fee</th>
                        <th class="p-3 font-medium">Status</th>
                        <th class="p-3"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="method in props.deliveryMethods" :key="method.id" class="border-t border-sidebar-border/40">
                        <td class="p-3">
                            <div class="font-medium">{{ method.name }}</div>
                            <div class="text-muted-foreground">{{ method.description }}</div>
                        </td>
                        <td class="p-3">{{ naira(method.fee) }}</td>
                        <td class="p-3">
                            <button
                                class="rounded-md border px-2 py-1 text-xs"
                                :class="method.is_active ? 'text-green-600' : 'text-muted-foreground'"
                                @click="toggleActive(method)"
                            >
                                {{ method.is_active ? 'Active' : 'Inactive' }}
                            </button>
                        </td>
                        <td class="p-3 text-right">
                            <button class="text-red-600" @click="remove(method.id)">Delete</button>
                        </td>
                    </tr>
                    <tr v-if="props.deliveryMethods.length === 0">
                        <td class="p-4 text-center text-muted-foreground" colspan="4">No delivery methods yet.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
