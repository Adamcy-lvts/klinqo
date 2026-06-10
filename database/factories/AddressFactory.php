<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => fake()->randomElement(['Home', 'Work', 'Office']),
            'address_line' => fake()->address(),
            'landmark' => fake()->optional()->streetName(),
            'phone' => fake()->e164PhoneNumber(),
            'latitude' => fake()->latitude(6, 7),
            'longitude' => fake()->longitude(3, 4),
            'is_default' => false,
        ];
    }

    public function default(): static
    {
        return $this->state(fn () => ['is_default' => true]);
    }
}
