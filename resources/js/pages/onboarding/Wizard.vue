<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3';
import { dashboard } from '@/routes';

interface BusinessDraft {
    name: string | null;
    tagline: string | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    area: string | null;
    business_code: string;
    status: string;
}

const props = defineProps<{
    business: BusinessDraft | null;
    step: string;
    allCuisines: Array<{ id: string; name: string; emoji: string | null }>;
    selectedCuisines: string[];
}>();

const details = useForm({
    name: props.business?.name ?? '',
    tagline: props.business?.tagline ?? '',
    description: props.business?.description ?? '',
    phone: props.business?.phone ?? '',
    email: props.business?.email ?? '',
});

const location = useForm({
    address: props.business?.address ?? '',
    area: props.business?.area ?? '',
    latitude: null as number | null,
    longitude: null as number | null,
});

const cuisines = useForm<{ cuisines: string[] }>({ cuisines: [...props.selectedCuisines] });

const payout = useForm({ bank_name: '', bank_code: '', account_number: '', account_name: '' });

const toggleCuisine = (id: string) => {
    const i = cuisines.cuisines.indexOf(id);
    if (i === -1) cuisines.cuisines.push(id);
    else cuisines.cuisines.splice(i, 1);
};

const stepOrder = ['details', 'location', 'cuisines', 'payout', 'submitted'];
const stepIndex = (s: string) => stepOrder.indexOf(s);
</script>

<template>
    <Head title="Set up your kitchen" />

    <div class="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-900">
        <div class="mx-auto max-w-xl">
            <h1 class="text-2xl font-bold">Set up your kitchen</h1>

            <!-- progress -->
            <div class="mt-4 flex gap-1">
                <div
                    v-for="(s, i) in stepOrder.slice(0, 4)"
                    :key="s"
                    class="h-1.5 flex-1 rounded-full"
                    :class="stepIndex(step) >= i ? 'bg-orange-500' : 'bg-neutral-200'"
                />
            </div>

            <!-- Step: details -->
            <form v-if="step === 'details'" class="mt-6 space-y-3 rounded-xl bg-white p-5 shadow-sm" @submit.prevent="details.post('/onboarding/details')">
                <h2 class="font-semibold">Business details</h2>
                <input v-model="details.name" placeholder="Kitchen name" class="w-full rounded-md border px-3 py-2" />
                <p v-if="details.errors.name" class="text-sm text-red-600">{{ details.errors.name }}</p>
                <input v-model="details.tagline" placeholder="Tagline" class="w-full rounded-md border px-3 py-2" />
                <textarea v-model="details.description" placeholder="Description" rows="3" class="w-full rounded-md border px-3 py-2"></textarea>
                <input v-model="details.phone" placeholder="Phone" class="w-full rounded-md border px-3 py-2" />
                <input v-model="details.email" placeholder="Email" class="w-full rounded-md border px-3 py-2" />
                <button class="w-full rounded-lg bg-orange-500 py-2 text-white" :disabled="details.processing">Continue</button>
            </form>

            <!-- Step: location -->
            <form v-else-if="step === 'location'" class="mt-6 space-y-3 rounded-xl bg-white p-5 shadow-sm" @submit.prevent="location.post('/onboarding/location')">
                <h2 class="font-semibold">Location</h2>
                <input v-model="location.address" placeholder="Address" class="w-full rounded-md border px-3 py-2" />
                <p v-if="location.errors.address" class="text-sm text-red-600">{{ location.errors.address }}</p>
                <input v-model="location.area" placeholder="Area (e.g. Ikeja)" class="w-full rounded-md border px-3 py-2" />
                <p v-if="location.errors.area" class="text-sm text-red-600">{{ location.errors.area }}</p>
                <button class="w-full rounded-lg bg-orange-500 py-2 text-white" :disabled="location.processing">Continue</button>
            </form>

            <!-- Step: cuisines -->
            <form v-else-if="step === 'cuisines'" class="mt-6 space-y-3 rounded-xl bg-white p-5 shadow-sm" @submit.prevent="cuisines.post('/onboarding/cuisines')">
                <h2 class="font-semibold">Cuisines</h2>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="c in allCuisines"
                        :key="c.id"
                        type="button"
                        class="rounded-full border px-3 py-1 text-sm"
                        :class="cuisines.cuisines.includes(c.id) ? 'bg-orange-500 text-white' : ''"
                        @click="toggleCuisine(c.id)"
                    >
                        <span v-if="c.emoji">{{ c.emoji }} </span>{{ c.name }}
                    </button>
                </div>
                <p v-if="cuisines.errors.cuisines" class="text-sm text-red-600">{{ cuisines.errors.cuisines }}</p>
                <button class="w-full rounded-lg bg-orange-500 py-2 text-white" :disabled="cuisines.processing">Continue</button>
            </form>

            <!-- Step: payout -->
            <form v-else-if="step === 'payout'" class="mt-6 space-y-3 rounded-xl bg-white p-5 shadow-sm" @submit.prevent="payout.post('/onboarding/payout')">
                <h2 class="font-semibold">Payout details</h2>
                <p class="text-sm text-neutral-500">Where we settle your earnings (after platform commission).</p>
                <input v-model="payout.bank_name" placeholder="Bank name" class="w-full rounded-md border px-3 py-2" />
                <input v-model="payout.bank_code" placeholder="Bank code" class="w-full rounded-md border px-3 py-2" />
                <input v-model="payout.account_number" placeholder="Account number" class="w-full rounded-md border px-3 py-2" />
                <input v-model="payout.account_name" placeholder="Account name" class="w-full rounded-md border px-3 py-2" />
                <button class="w-full rounded-lg bg-orange-500 py-2 text-white" :disabled="payout.processing">Submit for review</button>
            </form>

            <!-- Step: submitted -->
            <div v-else class="mt-6 rounded-xl bg-white p-8 text-center shadow-sm">
                <h2 class="text-xl font-semibold">You're all set 🎉</h2>
                <p class="mt-2 text-neutral-600">
                    Your kitchen <strong>{{ business?.name }}</strong> (code {{ business?.business_code }}) is pending review.
                    We'll notify you once it's approved.
                </p>
                <a :href="dashboard().url" class="mt-4 inline-block rounded-lg bg-orange-500 px-5 py-2 text-white">Go to dashboard</a>
            </div>
        </div>
    </div>
</template>
