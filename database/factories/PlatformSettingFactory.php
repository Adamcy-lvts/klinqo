<?php

namespace Database\Factories;

use App\Models\PlatformSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlatformSetting>
 */
class PlatformSettingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'default_commission_percent' => 15.00,
            'support_phone' => '+2348000000000',
            'support_email' => 'support@klinqo.test',
        ];
    }
}
