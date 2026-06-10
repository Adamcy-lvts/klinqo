<?php

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class PlatformSettingsSeeder extends Seeder
{
    public function run(): void
    {
        PlatformSetting::query()->updateOrCreate([], [
            'default_commission_percent' => 15.00,
            'support_phone' => '+2348000000000',
            'support_email' => 'support@klinqo.app',
        ]);
    }
}
