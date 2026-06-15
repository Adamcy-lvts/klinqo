<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Category;
use App\Models\Cuisine;
use App\Models\DeliveryMethod;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MirasDelightSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::query()->updateOrCreate(
            ['phone' => '+2348011112222'],
            [
                'name' => 'Samira Mohammed',
                'email' => 'mira@klinqo.test',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'role' => 'business_owner',
                'is_verified' => true,
            ],
        );

        $business = Business::query()->updateOrCreate(
            ['slug' => 'miras-delight'],
            [
                'owner_user_id' => $owner->id,
                'name' => "Mira's Delight",
                'business_code' => 'MIRA01',
                'tagline' => 'Home-style Nigerian comfort food',
                'description' => 'Fresh, hearty Nigerian dishes cooked to order with love.',
                'phone' => '+2348011112222',
                'email' => 'hello@mirasdelight.test',
                'address' => '14 Allen Avenue, Ikeja',
                'area' => 'Ikeja',
                'latitude' => 6.6018,
                'longitude' => 3.3515,
                'prep_time_min' => 20,
                'prep_time_max' => 45,
                'status' => 'active',
                'commission_percent' => null,
                'operating_hours' => [
                    'mon' => ['08:00', '21:00'],
                    'tue' => ['08:00', '21:00'],
                    'wed' => ['08:00', '21:00'],
                    'thu' => ['08:00', '21:00'],
                    'fri' => ['08:00', '22:00'],
                    'sat' => ['10:00', '22:00'],
                    'sun' => ['12:00', '20:00'],
                ],
                'accepts_online' => true,
                'accepts_on_delivery' => true,
                'accepts_on_pickup' => true,
                'onboarded_at' => now(),
            ],
        );

        // Discovery cuisines
        $cuisineIds = Cuisine::query()
            ->whereIn('slug', ['nigerian', 'rice-dishes', 'swallow-soups', 'grills-bbq'])
            ->pluck('id');
        $business->cuisines()->syncWithoutDetaching($cuisineIds);

        // Delivery methods
        DeliveryMethod::query()->updateOrCreate(
            ['business_id' => $business->id, 'name' => 'Pickup'],
            ['description' => 'Collect from the kitchen', 'fee' => 0, 'is_active' => true, 'sort_order' => 0],
        );
        DeliveryMethod::query()->updateOrCreate(
            ['business_id' => $business->id, 'name' => 'Standard Delivery'],
            ['description' => 'Delivered within Ikeja in 30–60 mins', 'fee' => 800, 'is_active' => true, 'sort_order' => 1],
        );

        // Menu: categories + items
        $menu = [
            'Rice Dishes' => [
                'emoji' => '🍚',
                'items' => [
                    ['Jollof Rice & Chicken', 'Smoky party jollof with grilled chicken', 3500, true],
                    ['Fried Rice & Turkey', 'Vegetable fried rice with peppered turkey', 4000, true],
                    ['Coconut Rice & Fish', 'Fragrant coconut rice with fried croaker', 4200, false],
                ],
            ],
            'Swallow & Soups' => [
                'emoji' => '🍲',
                'items' => [
                    ['Pounded Yam & Egusi', 'Melon seed soup with assorted meat', 4500, true],
                    ['Eba & Ogbono', 'Draw soup with goat meat', 4000, false],
                    ['Amala & Ewedu', 'With gbegiri and assorted meat', 4300, false],
                ],
            ],
            'Grills' => [
                'emoji' => '🍗',
                'items' => [
                    ['Suya Platter', 'Spicy grilled beef skewers with onions', 3000, true],
                    ['Peppered Chicken', 'Grilled chicken in spicy pepper sauce', 3500, false],
                    ['Grilled Catfish', 'Whole catfish with pepper sauce', 5000, false],
                ],
            ],
            'Sides' => [
                'emoji' => '🍟',
                'items' => [
                    ['Plantain (Dodo)', 'Sweet fried ripe plantain', 1000, false],
                    ['Moi Moi', 'Steamed bean pudding', 1200, false],
                ],
            ],
            'Drinks' => [
                'emoji' => '🥤',
                'items' => [
                    ['Chapman', 'Classic Nigerian fruit cocktail', 1500, true],
                    ['Zobo', 'Chilled hibiscus drink', 1000, false],
                ],
            ],
        ];

        $sort = 0;
        foreach ($menu as $categoryName => $config) {
            $category = Category::query()->updateOrCreate(
                ['business_id' => $business->id, 'name' => $categoryName],
                ['emoji' => $config['emoji'], 'sort_order' => $sort++, 'is_active' => true],
            );

            $itemSort = 0;
            foreach ($config['items'] as [$name, $description, $price, $popular]) {
                MenuItem::query()->updateOrCreate(
                    ['business_id' => $business->id, 'category_id' => $category->id, 'name' => $name],
                    [
                        'description' => $description,
                        'price' => $price,
                        'prep_minutes' => 25,
                        'is_available' => true,
                        'is_popular' => $popular,
                        'sort_order' => $itemSort++,
                    ],
                );
            }
        }
    }
}
