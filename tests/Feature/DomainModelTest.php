<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Business;
use App\Models\Category;
use App\Models\Cuisine;
use App\Models\DeliveryMethod;
use App\Models\MenuItem;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PlatformSetting;
use App\Models\Promotion;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_business_belongs_to_owner_and_has_menu_relations(): void
    {
        $owner = User::factory()->businessOwner()->create();
        $business = Business::factory()->create(['owner_user_id' => $owner->id]);
        $category = Category::factory()->create(['business_id' => $business->id]);
        MenuItem::factory()->count(3)->create([
            'business_id' => $business->id,
            'category_id' => $category->id,
        ]);
        DeliveryMethod::factory()->count(2)->create(['business_id' => $business->id]);

        $this->assertTrue($business->owner->is($owner));
        $this->assertCount(1, $business->categories);
        $this->assertCount(3, $business->menuItems);
        $this->assertCount(2, $business->deliveryMethods);
        $this->assertTrue($category->business->is($business));
    }

    public function test_business_cuisine_pivot_uses_uuid(): void
    {
        $business = Business::factory()->create();
        $cuisine = Cuisine::factory()->create();

        $business->cuisines()->attach($cuisine);

        $this->assertCount(1, $business->fresh()->cuisines);
        $this->assertCount(1, $cuisine->fresh()->businesses);
    }

    public function test_user_can_join_a_kitchen_via_membership_pivot(): void
    {
        $user = User::factory()->create();
        $business = Business::factory()->create();

        $user->memberships()->attach($business, ['joined_at' => now()]);

        $this->assertCount(1, $user->fresh()->memberships);
        $this->assertCount(1, $business->fresh()->members);
    }

    public function test_active_scope_only_returns_active_businesses(): void
    {
        Business::factory()->create(['status' => 'active']);
        Business::factory()->pending()->create();
        Business::factory()->suspended()->create();

        $this->assertCount(1, Business::active()->get());
    }

    public function test_available_scope_only_returns_available_menu_items(): void
    {
        $category = Category::factory()->create();
        MenuItem::factory()->create(['category_id' => $category->id, 'business_id' => $category->business_id]);
        MenuItem::factory()->unavailable()->create(['category_id' => $category->id, 'business_id' => $category->business_id]);

        $this->assertCount(1, MenuItem::available()->get());
    }

    public function test_effective_commission_falls_back_to_platform_default(): void
    {
        PlatformSetting::query()->updateOrCreate([], ['default_commission_percent' => 12.50]);

        $default = Business::factory()->create(['commission_percent' => null]);
        $override = Business::factory()->create(['commission_percent' => 8.00]);

        $this->assertSame(12.50, $default->effectiveCommissionPercent());
        $this->assertSame(8.00, $override->effectiveCommissionPercent());
    }

    public function test_order_auto_generates_sequential_order_number(): void
    {
        $first = Order::factory()->create();
        $second = Order::factory()->create();

        $this->assertSame('KLQ-0001', $first->order_number);
        $this->assertSame('KLQ-0002', $second->order_number);
        $this->assertNotNull($first->placed_at);
    }

    public function test_order_has_items_review_and_belongs_to_business_and_user(): void
    {
        $order = Order::factory()->create();
        OrderItem::factory()->count(2)->create(['order_id' => $order->id]);
        $review = Review::factory()->create([
            'order_id' => $order->id,
            'business_id' => $order->business_id,
            'user_id' => $order->user_id,
        ]);

        $this->assertCount(2, $order->items);
        $this->assertTrue($order->review->is($review));
        $this->assertInstanceOf(Business::class, $order->business);
        $this->assertInstanceOf(User::class, $order->user);
    }

    public function test_promotion_active_scope_respects_validity_window(): void
    {
        Promotion::factory()->create();
        Promotion::factory()->create(['is_active' => false]);
        Promotion::factory()->create(['ends_at' => now()->subDay()]);

        $this->assertCount(1, Promotion::active()->get());
    }

    public function test_user_owns_addresses_and_notifications(): void
    {
        $user = User::factory()->create();
        Address::factory()->count(2)->create(['user_id' => $user->id]);
        Notification::factory()->create(['user_id' => $user->id]);

        $this->assertCount(2, $user->addresses);
        $this->assertCount(1, $user->appNotifications);
    }

    public function test_admin_helper_reflects_role(): void
    {
        $this->assertTrue(User::factory()->admin()->create()->isAdmin());
        $this->assertFalse(User::factory()->create()->isAdmin());
    }
}
