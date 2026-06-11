<script setup lang="ts">
import { Head, router, useForm } from '@inertiajs/vue3';
import { dashboard } from '@/routes';

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: string | number;
    image_url: string | null;
    is_available: boolean;
    is_popular: boolean;
    sort_order: number;
}

interface Category {
    id: string;
    name: string;
    emoji: string | null;
    is_active: boolean;
    menu_items: MenuItem[];
}

const props = defineProps<{ categories: Category[] }>();

defineOptions({
    layout: {
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Menu', href: '/menu' },
        ],
    },
});

const naira = (value: string | number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(value));

const categoryForm = useForm({ name: '', emoji: '' });

const submitCategory = () =>
    categoryForm.post('/menu/categories', {
        preserveScroll: true,
        onSuccess: () => categoryForm.reset(),
    });

const deleteCategory = (id: string) => {
    if (confirm('Delete this category and its items?')) {
        router.delete(`/menu/categories/${id}`, { preserveScroll: true });
    }
};

const itemForm = useForm<{
    category_id: string;
    name: string;
    price: string;
    description: string;
    image: File | null;
}>({ category_id: '', name: '', price: '', description: '', image: null });

const submitItem = (categoryId: string) => {
    itemForm.category_id = categoryId;
    itemForm.post('/menu/items', {
        preserveScroll: true,
        forceFormData: true,
        onSuccess: () => itemForm.reset(),
    });
};

const toggle = (item: MenuItem, field: 'is_available' | 'is_popular') => {
    router.patch(
        `/menu/items/${item.id}/toggle`,
        { field, value: !item[field] },
        { preserveScroll: true },
    );
};

const deleteItem = (id: string) => {
    if (confirm('Delete this item?')) {
        router.delete(`/menu/items/${id}`, { preserveScroll: true });
    }
};

const moveItem = (category: Category, index: number, direction: -1 | 1) => {
    const items = [...category.menu_items];
    const target = index + direction;
    if (target < 0 || target >= items.length) {
        return;
    }
    [items[index], items[target]] = [items[target], items[index]];
    router.post(
        '/menu/items/reorder',
        { ids: items.map((i) => i.id) },
        { preserveScroll: true },
    );
};
</script>

<template>
    <Head title="Menu" />

    <div class="flex h-full flex-1 flex-col gap-6 p-4">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">Menu</h1>
        </div>

        <!-- Add category -->
        <form
            class="flex flex-wrap items-end gap-3 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
            @submit.prevent="submitCategory"
        >
            <div class="flex flex-col">
                <label class="text-xs text-muted-foreground">Category name</label>
                <input v-model="categoryForm.name" class="rounded-md border px-3 py-2" placeholder="e.g. Rice Dishes" />
            </div>
            <div class="flex flex-col">
                <label class="text-xs text-muted-foreground">Emoji</label>
                <input v-model="categoryForm.emoji" class="w-20 rounded-md border px-3 py-2" placeholder="🍚" />
            </div>
            <button class="rounded-md bg-primary px-4 py-2 text-primary-foreground" :disabled="categoryForm.processing">
                Add category
            </button>
        </form>

        <div v-if="props.categories.length === 0" class="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No categories yet. Add your first category above.
        </div>

        <!-- Categories -->
        <div
            v-for="category in props.categories"
            :key="category.id"
            class="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
        >
            <div class="flex items-center justify-between border-b border-sidebar-border/70 p-4 dark:border-sidebar-border">
                <h2 class="font-medium">
                    <span v-if="category.emoji">{{ category.emoji }} </span>{{ category.name }}
                    <span v-if="!category.is_active" class="ml-2 text-xs text-muted-foreground">(hidden)</span>
                </h2>
                <button class="text-sm text-red-600" @click="deleteCategory(category.id)">Delete</button>
            </div>

            <table class="w-full text-sm">
                <tbody>
                    <tr
                        v-for="(item, index) in category.menu_items"
                        :key="item.id"
                        class="border-t border-sidebar-border/40"
                    >
                        <td class="p-3">
                            <div class="font-medium">{{ item.name }}</div>
                            <div class="text-muted-foreground">{{ naira(item.price) }}</div>
                        </td>
                        <td class="p-3">
                            <button
                                class="rounded-md border px-2 py-1 text-xs"
                                :class="item.is_available ? 'text-green-600' : 'text-muted-foreground'"
                                @click="toggle(item, 'is_available')"
                            >
                                {{ item.is_available ? 'Available' : 'Unavailable' }}
                            </button>
                            <button
                                class="ml-2 rounded-md border px-2 py-1 text-xs"
                                :class="item.is_popular ? 'text-orange-600' : 'text-muted-foreground'"
                                @click="toggle(item, 'is_popular')"
                            >
                                {{ item.is_popular ? '★ Popular' : 'Mark popular' }}
                            </button>
                        </td>
                        <td class="p-3 text-right">
                            <button class="px-1" :disabled="index === 0" @click="moveItem(category, index, -1)">↑</button>
                            <button
                                class="px-1"
                                :disabled="index === category.menu_items.length - 1"
                                @click="moveItem(category, index, 1)"
                            >
                                ↓
                            </button>
                            <button class="ml-2 text-red-600" @click="deleteItem(item.id)">Delete</button>
                        </td>
                    </tr>
                    <tr v-if="category.menu_items.length === 0">
                        <td class="p-3 text-muted-foreground" colspan="3">No items in this category yet.</td>
                    </tr>
                </tbody>
            </table>

            <!-- Add item -->
            <form
                class="flex flex-wrap items-end gap-3 border-t border-sidebar-border/40 p-4"
                @submit.prevent="submitItem(category.id)"
            >
                <div class="flex flex-col">
                    <label class="text-xs text-muted-foreground">Item name</label>
                    <input v-model="itemForm.name" class="rounded-md border px-3 py-2" placeholder="Jollof Rice" />
                </div>
                <div class="flex flex-col">
                    <label class="text-xs text-muted-foreground">Price (₦)</label>
                    <input v-model="itemForm.price" type="number" step="0.01" class="w-28 rounded-md border px-3 py-2" />
                </div>
                <div class="flex flex-col">
                    <label class="text-xs text-muted-foreground">Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        class="text-sm"
                        @input="itemForm.image = ($event.target as HTMLInputElement).files?.[0] ?? null"
                    />
                </div>
                <button class="rounded-md bg-primary px-4 py-2 text-primary-foreground" :disabled="itemForm.processing">
                    Add item
                </button>
            </form>
        </div>
    </div>
</template>
