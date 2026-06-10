<?php

namespace Database\Factories;

use App\Models\Promotion;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Promotion>
 */
class PromotionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(['free_delivery', 'percent_off', 'flat_off']);

        return [
            'business_id' => null,
            'code' => Str::upper(fake()->unique()->lexify('?????')),
            'title' => fake()->sentence(4),
            'subtitle' => fake()->optional()->sentence(),
            'type' => $type,
            'value' => match ($type) {
                'percent_off' => fake()->randomElement([10, 15, 20]),
                'flat_off' => fake()->randomElement([500, 1000]),
                default => 0,
            },
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'is_active' => true,
        ];
    }

    public function freeDelivery(): static
    {
        return $this->state(fn () => ['type' => 'free_delivery', 'value' => 0]);
    }
}
