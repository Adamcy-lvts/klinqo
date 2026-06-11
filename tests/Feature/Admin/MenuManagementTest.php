<?php

namespace Tests\Feature\Admin;

use App\Models\Business;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MenuManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    /**
     * @return array{0: User, 1: Business}
     */
    private function owner(): array
    {
        $owner = User::factory()->businessOwner()->create();
        $business = Business::factory()->create(['owner_user_id' => $owner->id]);

        return [$owner, $business];
    }

    public function test_menu_index_lists_only_the_owners_categories(): void
    {
        [$owner, $business] = $this->owner();
        Category::factory()->create(['business_id' => $business->id]);
        Category::factory()->create(); // another kitchen

        $this->actingAs($owner)
            ->get(route('menu.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/menu/Index')
                ->has('categories', 1)
            );
    }

    public function test_owner_can_create_a_category(): void
    {
        [$owner, $business] = $this->owner();

        $this->actingAs($owner)
            ->post(route('menu.categories.store'), ['name' => 'Rice Dishes', 'emoji' => '🍚'])
            ->assertRedirect();

        $this->assertDatabaseHas('categories', [
            'business_id' => $business->id,
            'name' => 'Rice Dishes',
        ]);
    }

    public function test_owner_cannot_update_another_kitchens_category(): void
    {
        [$owner] = $this->owner();
        $foreign = Category::factory()->create();

        $this->actingAs($owner)
            ->put(route('menu.categories.update', $foreign), ['name' => 'Hacked'])
            ->assertForbidden();

        $this->assertDatabaseMissing('categories', ['id' => $foreign->id, 'name' => 'Hacked']);
    }

    public function test_owner_can_create_a_menu_item_with_an_image(): void
    {
        Storage::fake('public');
        [$owner, $business] = $this->owner();
        $category = Category::factory()->create(['business_id' => $business->id]);

        $this->actingAs($owner)
            ->post(route('menu.items.store'), [
                'category_id' => $category->id,
                'name' => 'Jollof Rice',
                'price' => 3500,
                'image' => UploadedFile::fake()->image('jollof.jpg'),
            ])
            ->assertRedirect();

        $item = MenuItem::firstWhere('name', 'Jollof Rice');
        $this->assertNotNull($item);
        $this->assertSame($business->id, $item->business_id);
        $this->assertNotNull($item->image_url);
        $this->assertCount(1, Storage::disk('public')->allFiles('menu-items'));
    }

    public function test_menu_item_must_use_a_category_from_the_same_kitchen(): void
    {
        [$owner] = $this->owner();
        $foreignCategory = Category::factory()->create();

        $this->actingAs($owner)
            ->post(route('menu.items.store'), [
                'category_id' => $foreignCategory->id,
                'name' => 'Sneaky Item',
                'price' => 1000,
            ])
            ->assertSessionHasErrors('category_id');

        $this->assertDatabaseMissing('menu_items', ['name' => 'Sneaky Item']);
    }

    public function test_owner_can_toggle_availability(): void
    {
        [$owner, $business] = $this->owner();
        $category = Category::factory()->create(['business_id' => $business->id]);
        $item = MenuItem::factory()->create([
            'business_id' => $business->id,
            'category_id' => $category->id,
            'is_available' => true,
        ]);

        $this->actingAs($owner)
            ->patch(route('menu.items.toggle', $item), ['field' => 'is_available', 'value' => false])
            ->assertRedirect();

        $this->assertFalse($item->fresh()->is_available);
    }

    public function test_owner_can_reorder_items(): void
    {
        [$owner, $business] = $this->owner();
        $category = Category::factory()->create(['business_id' => $business->id]);
        $a = MenuItem::factory()->create(['business_id' => $business->id, 'category_id' => $category->id, 'sort_order' => 0]);
        $b = MenuItem::factory()->create(['business_id' => $business->id, 'category_id' => $category->id, 'sort_order' => 1]);

        $this->actingAs($owner)
            ->post(route('menu.items.reorder'), ['ids' => [$b->id, $a->id]])
            ->assertRedirect();

        $this->assertSame(0, $b->fresh()->sort_order);
        $this->assertSame(1, $a->fresh()->sort_order);
    }

    public function test_customer_cannot_reach_menu_management(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']));

        $this->get(route('menu.index'))->assertForbidden();
    }
}
