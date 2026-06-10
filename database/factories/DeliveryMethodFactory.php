<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\DeliveryMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DeliveryMethod>
 */
class DeliveryMethodFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->randomElement(['Pickup', 'Standard Delivery', 'Express Delivery']),
            'description' => fake()->sentence(),
            'fee' => fake()->randomElement([0, 500, 800, 1200]),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(0, 5),
        ];
    }

    public function pickup(): static
    {
        return $this->state(fn () => [
            'name' => 'Pickup',
            'description' => 'Collect your order from the kitchen',
            'fee' => 0,
            'sort_order' => 0,
        ]);
    }
}
