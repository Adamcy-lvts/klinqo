<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3';

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.post('/platform/login', {
        onFinish: () => form.reset('password'),
    });
};
</script>

<template>
    <Head title="Savora — Console sign in" />

    <div class="sav-root sav-login">
        <div class="sav-login-bg" />

        <form class="sav-login-card" @submit.prevent="submit">
            <div class="sav-login-brand">
                <img src="/savora/mark.png" alt="Savora" width="40" height="36" />
                <div>
                    <div class="sav-login-name">Savora</div>
                    <div class="sav-login-kicker">Operations Console</div>
                </div>
            </div>

            <h1 class="sav-login-title">Platform sign in</h1>
            <p class="sav-login-sub">Admin access to the operations console.</p>

            <label class="sav-field">
                <span>Email</span>
                <input v-model="form.email" type="email" autocomplete="email" autofocus placeholder="you@savora.africa" />
            </label>
            <p v-if="form.errors.email" class="sav-error">{{ form.errors.email }}</p>

            <label class="sav-field">
                <span>Password</span>
                <input v-model="form.password" type="password" autocomplete="current-password" placeholder="••••••••" />
            </label>
            <p v-if="form.errors.password" class="sav-error">{{ form.errors.password }}</p>

            <label class="sav-remember">
                <input v-model="form.remember" type="checkbox" />
                <span>Keep me signed in</span>
            </label>

            <button type="submit" class="sav-login-btn" :disabled="form.processing">
                {{ form.processing ? 'Signing in…' : 'Sign in to console' }}
            </button>
        </form>
    </div>
</template>
