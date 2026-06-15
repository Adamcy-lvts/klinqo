<?php

namespace Tests\Feature\Storefront;

use App\Models\Business;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontBrowsingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Cache::flush();
    }

    public function test_storefront_resolves_a_kitchen_by_code_with_its_menu(): void
    {
        $kitchen = Business::factory()->create(['business_code' => 'MIRA01']);
        $category = Category::factory()->create(['business_id' => $kitchen->id, 'is_active' => true]);
        MenuItem::factory()->create(['business_id' => $kitchen->id, 'category_id' => $category->id, 'is_available' => true]);
        MenuItem::factory()->unavailable()->create(['business_id' => $kitchen->id, 'category_id' => $category->id]);

        $this->get('/s/MIRA01')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('storefront/Show')
                ->where('kitchen.business_code', 'MIRA01')
                ->has('categories', 1)
                ->has('categories.0.menu_items', 1)
            );
    }

    public function test_storefront_code_is_case_insensitive(): void
    {
        Business::factory()->create(['business_code' => 'MIRA01']);

        $this->get('/s/mira01')->assertOk();
    }

    public function test_inactive_kitchen_storefront_returns_404(): void
    {
        Business::factory()->pending()->create(['business_code' => 'PEND01']);

        $this->get('/s/PEND01')->assertNotFound();
    }

    public function test_unknown_code_returns_404(): void
    {
        $this->get('/s/NOPE99')->assertNotFound();
    }
}
