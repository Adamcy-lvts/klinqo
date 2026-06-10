<?php

namespace Tests\Feature\Api;

use App\Models\Business;
use App\Models\Category;
use App\Models\Cuisine;
use App\Models\DeliveryMethod;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    /**
     * Create an active kitchen with one active category and the given items.
     *
     * @param  list<array{name: string, available?: bool, popular?: bool}>  $items
     */
    private function kitchenWithMenu(array $attributes = [], array $items = []): Business
    {
        $kitchen = Business::factory()->create($attributes);
        $category = Category::factory()->create(['business_id' => $kitchen->id]);

        foreach ($items as $item) {
            MenuItem::factory()->create([
                'business_id' => $kitchen->id,
                'category_id' => $category->id,
                'name' => $item['name'],
                'is_available' => $item['available'] ?? true,
                'is_popular' => $item['popular'] ?? false,
            ]);
        }

        return $kitchen;
    }

    public function test_cuisines_are_listed(): void
    {
        Cuisine::factory()->count(3)->create();

        $this->getJson('/api/cuisines')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure(['data' => [['id', 'name', 'slug', 'emoji']]]);
    }

    public function test_kitchens_index_only_returns_active_kitchens(): void
    {
        Business::factory()->create(['status' => 'active']);
        Business::factory()->pending()->create();
        Business::factory()->suspended()->create();

        $this->getJson('/api/kitchens')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_kitchens_can_be_filtered_by_cuisine(): void
    {
        $cuisine = Cuisine::factory()->create(['slug' => 'jollof']);
        $match = Business::factory()->create();
        $match->cuisines()->attach($cuisine);
        Business::factory()->create();

        $this->getJson('/api/kitchens?cuisine=jollof')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $match->id);
    }

    public function test_kitchens_can_be_searched_by_name_or_dish(): void
    {
        $byName = Business::factory()->create(['name' => 'Suya Spot']);
        $byDish = $this->kitchenWithMenu(['name' => 'Generic Kitchen'], [['name' => 'Spicy Suya Platter']]);
        $this->kitchenWithMenu(['name' => 'Unrelated'], [['name' => 'Plain Rice']]);

        $response = $this->getJson('/api/kitchens?q=suya')->assertOk();

        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($byName->id));
        $this->assertTrue($ids->contains($byDish->id));
        $this->assertCount(2, $ids);
    }

    public function test_kitchen_detail_includes_cuisines_and_delivery_methods(): void
    {
        $kitchen = Business::factory()->create();
        $kitchen->cuisines()->attach(Cuisine::factory()->create());
        DeliveryMethod::factory()->create(['business_id' => $kitchen->id, 'is_active' => true]);

        $this->getJson("/api/kitchens/{$kitchen->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $kitchen->id)
            ->assertJsonCount(1, 'data.cuisines')
            ->assertJsonCount(1, 'data.delivery_methods');
    }

    public function test_non_active_kitchen_detail_returns_404(): void
    {
        $kitchen = Business::factory()->pending()->create();

        $this->getJson("/api/kitchens/{$kitchen->id}")->assertNotFound();
    }

    public function test_kitchen_can_be_resolved_by_code(): void
    {
        $kitchen = Business::factory()->create(['business_code' => 'MIRA01']);

        $this->getJson('/api/kitchens/code/MIRA01')
            ->assertOk()
            ->assertJsonPath('data.id', $kitchen->id);
    }

    public function test_menu_returns_only_active_categories_and_available_items(): void
    {
        $kitchen = Business::factory()->create();
        $active = Category::factory()->create(['business_id' => $kitchen->id, 'is_active' => true]);
        $inactive = Category::factory()->create(['business_id' => $kitchen->id, 'is_active' => false]);

        MenuItem::factory()->create(['business_id' => $kitchen->id, 'category_id' => $active->id, 'is_available' => true]);
        MenuItem::factory()->unavailable()->create(['business_id' => $kitchen->id, 'category_id' => $active->id]);
        MenuItem::factory()->create(['business_id' => $kitchen->id, 'category_id' => $inactive->id]);

        $this->getJson("/api/kitchens/{$kitchen->id}/menu")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonCount(1, 'data.0.menu_items')
            ->assertJsonPath('data.0.id', $active->id);
    }

    public function test_menu_cache_is_invalidated_when_an_item_is_added(): void
    {
        $kitchen = Business::factory()->create();
        $category = Category::factory()->create(['business_id' => $kitchen->id]);
        MenuItem::factory()->create(['business_id' => $kitchen->id, 'category_id' => $category->id]);

        $this->getJson("/api/kitchens/{$kitchen->id}/menu")->assertJsonCount(1, 'data.0.menu_items');

        MenuItem::factory()->create(['business_id' => $kitchen->id, 'category_id' => $category->id]);

        $this->getJson("/api/kitchens/{$kitchen->id}/menu")->assertJsonCount(2, 'data.0.menu_items');
    }

    public function test_menu_item_detail_is_shown_for_available_items(): void
    {
        $kitchen = Business::factory()->create();
        $category = Category::factory()->create(['business_id' => $kitchen->id]);
        $item = MenuItem::factory()->create([
            'business_id' => $kitchen->id,
            'category_id' => $category->id,
            'is_popular' => true,
        ]);

        $this->getJson("/api/menu-items/{$item->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $item->id)
            ->assertJsonPath('data.is_popular', true);
    }

    public function test_unavailable_menu_item_detail_returns_404(): void
    {
        $kitchen = Business::factory()->create();
        $category = Category::factory()->create(['business_id' => $kitchen->id]);
        $item = MenuItem::factory()->unavailable()->create([
            'business_id' => $kitchen->id,
            'category_id' => $category->id,
        ]);

        $this->getJson("/api/menu-items/{$item->id}")->assertNotFound();
    }

    public function test_cross_kitchen_search_returns_kitchens_and_menu_items(): void
    {
        $this->kitchenWithMenu(['name' => 'Suya Spot'], [['name' => 'Beef Suya']]);
        $this->kitchenWithMenu(['name' => 'Rice Place'], [['name' => 'Jollof Rice']]);

        $this->getJson('/api/search?q=suya')
            ->assertOk()
            ->assertJsonCount(1, 'kitchens')
            ->assertJsonCount(1, 'menu_items');
    }

    public function test_search_requires_a_query(): void
    {
        $this->getJson('/api/search')->assertStatus(422)->assertJsonValidationErrors('q');
    }

    public function test_joining_a_kitchen_requires_authentication(): void
    {
        $kitchen = Business::factory()->create();

        $this->postJson("/api/kitchens/{$kitchen->id}/join")->assertUnauthorized();
    }

    public function test_user_can_join_a_kitchen_idempotently_and_list_memberships(): void
    {
        $user = User::factory()->create();
        $kitchen = Business::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson("/api/kitchens/{$kitchen->id}/join")->assertOk();
        $this->postJson("/api/kitchens/{$kitchen->id}/join")->assertOk();

        $this->assertCount(1, $user->fresh()->memberships);

        $this->getJson('/api/me/kitchens')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $kitchen->id);
    }

    public function test_kitchens_can_be_sorted_by_distance(): void
    {
        $near = Business::factory()->create(['latitude' => 6.5010, 'longitude' => 3.3510]);
        $far = Business::factory()->create(['latitude' => 6.6000, 'longitude' => 3.4000]);

        $response = $this->getJson('/api/kitchens?sort=distance&lat=6.5000&lng=3.3500')->assertOk();

        $this->assertSame($near->id, $response->json('data.0.id'));
        $this->assertSame($far->id, $response->json('data.1.id'));
        $this->assertNotNull($response->json('data.0.distance_km'));
    }
}
