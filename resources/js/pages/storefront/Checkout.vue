<script setup lang="ts">
import { Head, router, useForm, usePage } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';

interface DeliveryMethod { id: string; name: string; description: string | null; fee: string | number }
interface Address { id: string; label: string; address_line: string; phone: string }

interface Kitchen {
    id: string;
    name: string;
    business_code: string;
    accepts_online: boolean;
    accepts_on_delivery: boolean;
    accepts_on_pickup: boolean;
    delivery_methods: DeliveryMethod[];
}

const props = defineProps<{ kitchen: Kitchen; addresses: Address[] }>();

const page = usePage();
const isAuthed = computed(() => !!(page.props.auth as { user?: unknown } | undefined)?.user);

interface CartLine { id: string; name: string; price: number; qty: number }
const cartKey = `klinqo:cart:${props.kitchen.id}`;
const cart = ref<Record<string, CartLine>>({});

onMounted(() => {
    try {
        cart.value = JSON.parse(localStorage.getItem(cartKey) ?? '{}');
    } catch {
        cart.value = {};
    }
});

const lines = computed(() => Object.values(cart.value));
const subtotal = computed(() => lines.value.reduce((s, l) => s + l.price * l.qty, 0));
const naira = (v: string | number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(v));

// --- Inline phone + OTP auth ---
const authStep = ref<'phone' | 'code'>('phone');
const authForm = useForm({ phone: '', code: '', name: '' });

const sendOtp = () =>
    authForm.post('/storefront/auth/otp', {
        preserveScroll: true,
        onSuccess: () => (authStep.value = 'code'),
    });

const verifyOtp = () =>
    authForm.post('/storefront/auth/verify', {
        preserveScroll: true,
        onSuccess: () => router.reload({ only: ['addresses'] }),
    });

// --- Order ---
const order = useForm<{
    delivery_type: 'delivery' | 'pickup';
    payment_method: string;
    delivery_method_id: string | null;
    address_id: string | null;
    address_line: string;
    address_phone: string;
    address_label: string;
    landmark: string;
    note: string;
    items: Array<{ menu_item_id: string; quantity: number }>;
}>({
    delivery_type: props.kitchen.accepts_on_delivery ? 'delivery' : 'pickup',
    payment_method: props.kitchen.accepts_online ? 'online' : 'pay_on_delivery',
    delivery_method_id: props.kitchen.delivery_methods[0]?.id ?? null,
    address_id: null,
    address_line: '',
    address_phone: '',
    address_label: 'Home',
    landmark: '',
    note: '',
    items: [],
});

const paymentOptions = computed(() => {
    const options: Array<{ value: string; label: string }> = [];
    if (props.kitchen.accepts_online) options.push({ value: 'online', label: 'Pay online' });
    if (order.delivery_type === 'delivery' && props.kitchen.accepts_on_delivery) options.push({ value: 'pay_on_delivery', label: 'Pay on delivery' });
    if (order.delivery_type === 'pickup' && props.kitchen.accepts_on_pickup) options.push({ value: 'pay_on_pickup', label: 'Pay on pickup' });
    return options;
});

const placeOrder = () => {
    order.items = lines.value.map((l) => ({ menu_item_id: l.id, quantity: l.qty }));
    order.post(`/s/${props.kitchen.business_code}/checkout`, {
        onSuccess: () => localStorage.removeItem(cartKey),
    });
};
</script>

<template>
    <Head title="Checkout" />

    <div class="min-h-screen bg-neutral-50 px-4 pb-28 text-neutral-900">
        <div class="mx-auto max-w-xl py-4">
            <h1 class="text-xl font-bold">Checkout</h1>

            <!-- Summary -->
            <div class="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <div v-for="line in lines" :key="line.id" class="flex justify-between py-1 text-sm">
                    <span>{{ line.qty }} × {{ line.name }}</span>
                    <span>{{ naira(line.price * line.qty) }}</span>
                </div>
                <div class="mt-2 flex justify-between border-t pt-2 font-semibold">
                    <span>Subtotal</span><span>{{ naira(subtotal) }}</span>
                </div>
                <p v-if="lines.length === 0" class="text-sm text-neutral-500">Your cart is empty.</p>
            </div>

            <!-- Auth -->
            <div v-if="!isAuthed" class="mt-4 rounded-xl bg-white p-4 shadow-sm">
                <h2 class="mb-2 font-semibold">Verify your phone</h2>
                <template v-if="authStep === 'phone'">
                    <input v-model="authForm.phone" placeholder="Phone e.g. +23480..." class="w-full rounded-md border px-3 py-2" />
                    <p v-if="authForm.errors.phone" class="mt-1 text-sm text-red-600">{{ authForm.errors.phone }}</p>
                    <button class="mt-3 w-full rounded-lg bg-orange-500 py-2 text-white" :disabled="authForm.processing" @click="sendOtp">
                        Send code
                    </button>
                </template>
                <template v-else>
                    <input v-model="authForm.name" placeholder="Your name" class="mb-2 w-full rounded-md border px-3 py-2" />
                    <input v-model="authForm.code" placeholder="6-digit code" class="w-full rounded-md border px-3 py-2" />
                    <p v-if="authForm.errors.code" class="mt-1 text-sm text-red-600">{{ authForm.errors.code }}</p>
                    <button class="mt-3 w-full rounded-lg bg-orange-500 py-2 text-white" :disabled="authForm.processing" @click="verifyOtp">
                        Verify
                    </button>
                </template>
            </div>

            <!-- Order options -->
            <div v-else class="mt-4 space-y-4">
                <div class="rounded-xl bg-white p-4 shadow-sm">
                    <h2 class="mb-2 font-semibold">Delivery</h2>
                    <div class="flex gap-2">
                        <button
                            v-if="kitchen.accepts_on_delivery"
                            class="flex-1 rounded-lg border py-2 text-sm"
                            :class="order.delivery_type === 'delivery' ? 'border-orange-500 bg-orange-50' : ''"
                            @click="order.delivery_type = 'delivery'"
                        >
                            Delivery
                        </button>
                        <button
                            v-if="kitchen.accepts_on_pickup"
                            class="flex-1 rounded-lg border py-2 text-sm"
                            :class="order.delivery_type === 'pickup' ? 'border-orange-500 bg-orange-50' : ''"
                            @click="order.delivery_type = 'pickup'"
                        >
                            Pickup
                        </button>
                    </div>

                    <template v-if="order.delivery_type === 'delivery'">
                        <select v-model="order.delivery_method_id" class="mt-3 w-full rounded-md border px-3 py-2">
                            <option v-for="m in kitchen.delivery_methods" :key="m.id" :value="m.id">
                                {{ m.name }} — {{ naira(m.fee) }}
                            </option>
                        </select>

                        <select v-if="addresses.length" v-model="order.address_id" class="mt-3 w-full rounded-md border px-3 py-2">
                            <option :value="null">+ New address</option>
                            <option v-for="a in addresses" :key="a.id" :value="a.id">{{ a.label }} — {{ a.address_line }}</option>
                        </select>

                        <template v-if="!order.address_id">
                            <input v-model="order.address_line" placeholder="Address" class="mt-3 w-full rounded-md border px-3 py-2" />
                            <input v-model="order.address_phone" placeholder="Phone at this address" class="mt-2 w-full rounded-md border px-3 py-2" />
                            <input v-model="order.landmark" placeholder="Landmark (optional)" class="mt-2 w-full rounded-md border px-3 py-2" />
                        </template>
                    </template>
                </div>

                <div class="rounded-xl bg-white p-4 shadow-sm">
                    <h2 class="mb-2 font-semibold">Payment</h2>
                    <label v-for="opt in paymentOptions" :key="opt.value" class="flex items-center gap-2 py-1">
                        <input v-model="order.payment_method" type="radio" :value="opt.value" /> {{ opt.label }}
                    </label>
                </div>

                <textarea v-model="order.note" placeholder="Order note (optional)" class="w-full rounded-xl border p-3" rows="2"></textarea>
                <p v-if="order.errors.items" class="text-sm text-red-600">{{ order.errors.items }}</p>
                <p v-if="order.errors.payment_method" class="text-sm text-red-600">{{ order.errors.payment_method }}</p>
            </div>
        </div>

        <div v-if="isAuthed && lines.length" class="fixed inset-x-0 bottom-0 mx-auto max-w-xl p-3">
            <button class="w-full rounded-xl bg-orange-500 py-3 font-medium text-white shadow-lg" :disabled="order.processing" @click="placeOrder">
                Place order · {{ naira(subtotal) }}
            </button>
        </div>
    </div>
</template>
