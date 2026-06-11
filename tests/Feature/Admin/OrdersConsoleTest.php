<?php

namespace Tests\Feature\Admin;

use App\Models\Business;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OrdersConsoleTest extends TestCase
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

    public function test_orders_index_is_scoped_to_the_kitchen(): void
    {
        [$owner, $business] = $this->owner();
        Order::factory()->count(3)->create(['business_id' => $business->id]);
        Order::factory()->count(2)->create();

        $this->actingAs($owner)
            ->get(route('orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/Index')
                ->has('orders.data', 3)
            );
    }

    public function test_orders_can_be_filtered_by_status(): void
    {
        [$owner, $business] = $this->owner();
        Order::factory()->count(2)->create(['business_id' => $business->id, 'status' => 'placed']);
        Order::factory()->create(['business_id' => $business->id, 'status' => 'delivered']);

        $this->actingAs($owner)
            ->get(route('orders.index', ['status' => 'placed']))
            ->assertInertia(fn (Assert $page) => $page->has('orders.data', 2));
    }

    public function test_owner_can_advance_an_order_status(): void
    {
        [$owner, $business] = $this->owner();
        $order = Order::factory()->create(['business_id' => $business->id, 'status' => 'placed']);

        $this->actingAs($owner)
            ->post(route('orders.status.update', $order), ['status' => 'confirmed'])
            ->assertRedirect();

        $this->assertSame('confirmed', $order->fresh()->status);
    }

    public function test_illegal_transition_is_rejected(): void
    {
        [$owner, $business] = $this->owner();
        $order = Order::factory()->create(['business_id' => $business->id, 'status' => 'placed']);

        $this->actingAs($owner)
            ->post(route('orders.status.update', $order), ['status' => 'delivered'])
            ->assertSessionHasErrors('status');
    }

    public function test_owner_cannot_view_another_kitchens_order(): void
    {
        [$owner] = $this->owner();
        $foreign = Order::factory()->create();

        $this->actingAs($owner)->get(route('orders.show', $foreign))->assertForbidden();
    }

    public function test_owner_cannot_advance_another_kitchens_order(): void
    {
        [$owner] = $this->owner();
        $foreign = Order::factory()->create(['status' => 'placed']);

        $this->actingAs($owner)
            ->post(route('orders.status.update', $foreign), ['status' => 'confirmed'])
            ->assertForbidden();
    }

    public function test_customer_cannot_reach_orders_console(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']));

        $this->get(route('orders.index'))->assertForbidden();
    }
}
