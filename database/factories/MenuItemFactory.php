<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<MenuItem>
 */
class MenuItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'category_id' => Category::factory(),
            'name' => Str::title(fake()->word().' '.fake()->word()),
            'description' => fake()->sentence(),
            'price' => fake()->randomElement([1500, 2000, 2500, 3000, 3500, 4500, 5000]),
            'prep_minutes' => fake()->numberBetween(10, 40),
            'is_available' => true,
            'is_popular' => fake()->boolean(25),
            'sort_order' => fake()->numberBetween(0, 20),
        ];
    }

    public function unavailable(): static
    {
        return $this->state(fn () => ['is_available' => false]);
    }

    public function popular(): static
    {
        return $this->state(fn () => ['is_popular' => true]);
    }
}
