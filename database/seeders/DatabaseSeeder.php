<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PlatformSettingsSeeder::class,
            CuisineSeeder::class,
            AdminSeeder::class,
            MirasDelightSeeder::class,
        ]);

        // Demo customer for local testing.
        User::query()->updateOrCreate(
            ['phone' => '+2348012345678'],
            [
                'name' => 'Test Customer',
                'email' => 'test@example.com',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'customer',
                'is_verified' => true,
            ],
        );
    }
}
