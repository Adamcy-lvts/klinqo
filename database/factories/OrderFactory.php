<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = fake()->randomElement([2500, 3500, 5000, 7500]);
        $deliveryFee = fake()->randomElement([0, 500, 800]);
        $commissionPercent = 15.00;

        return [
            'business_id' => Business::factory(),
            'user_id' => User::factory(),
            'delivery_type' => fake()->randomElement(['delivery', 'pickup']),
            'delivery_method_id' => null,
            'address_id' => null,
            'payment_method' => fake()->randomElement(['online', 'pay_on_delivery', 'pay_on_pickup']),
            'payment_status' => 'pending',
            'status' => 'placed',
            'subtotal' => $subtotal,
            'delivery_fee' => $deliveryFee,
            'total' => $subtotal + $deliveryFee,
            'commission_percent' => $commissionPercent,
            'commission_amount' => round($subtotal * $commissionPercent / 100, 2),
            'note' => fake()->optional()->sentence(),
            'placed_at' => now(),
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'payment_method' => 'online',
            'payment_status' => 'paid',
            'status' => 'confirmed',
            'payment_reference' => 'PSK_'.fake()->unique()->bothify('??########'),
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn () => [
            'status' => 'delivered',
            'payment_status' => 'paid',
        ]);
    }
}
