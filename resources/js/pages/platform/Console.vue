<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import SavoraAdmin from '@/savora/SavoraAdmin';
import { setSavora } from '@/savora/store';

const props = defineProps<{ data?: Record<string, unknown> }>();

// Feed real platform data into the console store before first render.
setSavora(props.data);

const logout = () => router.post('/platform/logout');
</script>

<template>
    <Head title="Savora — Operations Console" />
    <SavoraAdmin :on-logout="logout" />
</template>
