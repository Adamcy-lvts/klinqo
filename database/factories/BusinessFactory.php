<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'owner_user_id' => User::factory()->state(['role' => 'business_owner']),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'business_code' => Str::upper(Str::random(8)),
            'tagline' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'phone' => fake()->unique()->e164PhoneNumber(),
            'email' => fake()->unique()->companyEmail(),
            'address' => fake()->address(),
            'area' => fake()->city(),
            'latitude' => fake()->latitude(6, 7),
            'longitude' => fake()->longitude(3, 4),
            'prep_time_min' => 15,
            'prep_time_max' => 35,
            'rating' => 0,
            'review_count' => 0,
            'status' => 'active',
            'commission_percent' => null,
            'operating_hours' => [
                'mon' => ['09:00', '21:00'],
                'tue' => ['09:00', '21:00'],
                'wed' => ['09:00', '21:00'],
                'thu' => ['09:00', '21:00'],
                'fri' => ['09:00', '22:00'],
                'sat' => ['10:00', '22:00'],
                'sun' => ['12:00', '20:00'],
            ],
            'accepts_online' => true,
            'accepts_on_delivery' => true,
            'accepts_on_pickup' => true,
            'onboarded_at' => now(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending', 'onboarded_at' => null]);
    }

    public function suspended(): static
    {
        return $this->state(fn () => ['status' => 'suspended']);
    }
}
