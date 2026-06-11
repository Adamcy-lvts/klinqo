<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_customers_cannot_access_the_kitchen_console(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']));

        $this->get(route('dashboard'))->assertForbidden();
    }

    public function test_business_owner_sees_their_dashboard(): void
    {
        $owner = User::factory()->businessOwner()->create();
        $business = Business::factory()->create(['owner_user_id' => $owner->id]);

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Dashboard')
                ->where('business.id', $business->id)
                ->has('metrics')
            );
    }

    public function test_dashboard_metrics_are_scoped_to_the_owners_kitchen(): void
    {
        $owner = User::factory()->businessOwner()->create();
        $business = Business::factory()->create(['owner_user_id' => $owner->id]);
        MenuItem::factory()->count(3)->create(['business_id' => $business->id, 'is_available' => true]);
        Order::factory()->count(2)->create(['business_id' => $business->id, 'placed_at' => now()]);

        // Another kitchen's data must not leak in.
        $other = Business::factory()->create();
        Order::factory()->count(5)->create(['business_id' => $other->id, 'placed_at' => now()]);

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('metrics.orders_today', 2)
                ->where('metrics.active_items', 3)
            );
    }
}
