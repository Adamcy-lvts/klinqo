<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Review>
 */
class ReviewFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'business_id' => Business::factory(),
            'user_id' => User::factory(),
            'rating' => fake()->numberBetween(3, 5),
            'text' => fake()->optional()->sentence(),
        ];
    }
}
