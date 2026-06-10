<?php

namespace Database\Seeders;

use App\Models\Cuisine;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CuisineSeeder extends Seeder
{
    /**
     * @var list<array{name: string, emoji: string}>
     */
    private array $cuisines = [
        ['name' => 'Nigerian', 'emoji' => '🇳🇬'],
        ['name' => 'Rice Dishes', 'emoji' => '🍚'],
        ['name' => 'Swallow & Soups', 'emoji' => '🍲'],
        ['name' => 'Grills & BBQ', 'emoji' => '🍗'],
        ['name' => 'Small Chops', 'emoji' => '🍢'],
        ['name' => 'Fast Food', 'emoji' => '🍔'],
        ['name' => 'Continental', 'emoji' => '🍝'],
        ['name' => 'Seafood', 'emoji' => '🦐'],
        ['name' => 'Pastries', 'emoji' => '🥐'],
        ['name' => 'Drinks', 'emoji' => '🥤'],
        ['name' => 'Desserts', 'emoji' => '🍰'],
        ['name' => 'Vegetarian', 'emoji' => '🥗'],
    ];

    public function run(): void
    {
        foreach ($this->cuisines as $cuisine) {
            Cuisine::query()->updateOrCreate(
                ['slug' => Str::slug($cuisine['name'])],
                ['name' => $cuisine['name'], 'emoji' => $cuisine['emoji']],
            );
        }
    }
}
