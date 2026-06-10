<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Seed the platform admin. Credentials are read from the environment so
     * production deploys never carry a hardcoded password:
     *   ADMIN_PHONE, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD
     * Sensible local-dev fallbacks are used when those are unset.
     */
    public function run(): void
    {
        $phone = config('klinqo.admin.phone');
        $email = config('klinqo.admin.email');

        User::query()->updateOrCreate(
            ['phone' => $phone],
            [
                'name' => config('klinqo.admin.name'),
                'email' => $email,
                'email_verified_at' => now(),
                'password' => Hash::make(config('klinqo.admin.password')),
                'role' => 'admin',
                'is_verified' => true,
            ],
        );

        $this->command->info("Platform admin seeded: {$email} ({$phone})");
    }
}
