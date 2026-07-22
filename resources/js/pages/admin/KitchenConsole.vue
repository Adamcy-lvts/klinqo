<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import KitchenConsole from '@/kitchen/KitchenConsole';

const logout = () => router.post('/logout');
</script>

<template>
    <Head title="Kitchen Console" />
    <KitchenConsole :on-logout="logout" />
</template>
