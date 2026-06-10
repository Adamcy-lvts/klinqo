<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\CommissionLedgerEntry;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommissionLedgerEntry>
 */
class CommissionLedgerEntryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'order_id' => Order::factory(),
            'type' => 'accrual',
            'amount' => fake()->randomElement([375, 525, 750]),
            'status' => 'pending',
            'note' => null,
        ];
    }
}
