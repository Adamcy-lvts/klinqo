<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Platform commission
    |--------------------------------------------------------------------------
    |
    | Default per-order commission percentage applied when a kitchen has no
    | per-kitchen override. The persisted platform_settings row takes
    | precedence at runtime; this is the bootstrap default.
    |
    */

    'default_commission_percent' => env('KLINQO_DEFAULT_COMMISSION_PERCENT', 15.00),

    /*
    |--------------------------------------------------------------------------
    | Platform admin (seeded)
    |--------------------------------------------------------------------------
    |
    | Credentials used by AdminSeeder to create/refresh the platform admin.
    | Override these in .env for staging/production so no real password is
    | ever committed. The local-dev fallbacks below are intentionally weak.
    |
    */

    'admin' => [
        'name' => env('ADMIN_NAME', 'Platform Admin'),
        'phone' => env('ADMIN_PHONE', '+2348000000001'),
        'email' => env('ADMIN_EMAIL', 'admin@klinqo.test'),
        'password' => env('ADMIN_PASSWORD', 'password'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Order numbering
    |--------------------------------------------------------------------------
    */

    'order_number_prefix' => env('KLINQO_ORDER_PREFIX', 'KLQ'),

    /*
    |--------------------------------------------------------------------------
    | OTP (phone verification)
    |--------------------------------------------------------------------------
    |
    | length         number of digits in the generated code
    | ttl            seconds a code stays valid (default 5 minutes)
    | max_attempts   wrong-code attempts before the code is invalidated
    | resend_cooldown seconds a user must wait before requesting a new code
    | verified_ttl   seconds a "phone verified" pass is honoured by register /
    |                reset-password after a successful verify-otp
    |
    */

    'otp' => [
        'length' => (int) env('KLINQO_OTP_LENGTH', 6),
        'ttl' => (int) env('KLINQO_OTP_TTL', 300),
        'max_attempts' => (int) env('KLINQO_OTP_MAX_ATTEMPTS', 5),
        'resend_cooldown' => (int) env('KLINQO_OTP_RESEND_COOLDOWN', 45),
        'verified_ttl' => (int) env('KLINQO_OTP_VERIFIED_TTL', 600),
    ],

];
