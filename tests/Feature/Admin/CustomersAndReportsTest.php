<?php

namespace Tests\Feature\Admin;

use App\Models\Business;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomersAndReportsTest extends TestCase
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

    public function test_customers_index_aggregates_orders_for_the_kitchen(): void
    {
        [$owner, $business] = $this->owner();
        $customer = User::factory()->create();
        Order::factory()->create(['business_id' => $business->id, 'user_id' => $customer->id, 'payment_status' => 'paid', 'total' => 5000]);
        Order::factory()->create(['business_id' => $business->id, 'user_id' => $customer->id, 'payment_status' => 'pending', 'total' => 2000]);

        // A customer of another kitchen must not appear.
        Order::factory()->create();

        $this->actingAs($owner)
            ->get(route('customers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/customers/Index')
                ->has('customers.data', 1)
                ->where('customers.data.0.order_count', 2)
                ->where('customers.data.0.total_spent', fn ($v) => (float) $v === 5000.0)
            );
    }

    public function test_customer_show_is_scoped_to_the_kitchen(): void
    {
        [$owner, $business] = $this->owner();
        $mine = User::factory()->create();
        Order::factory()->create(['business_id' => $business->id, 'user_id' => $mine->id]);

        $stranger = User::factory()->create();

        $this->actingAs($owner)->get(route('customers.show', $mine))->assertOk();
        $this->actingAs($owner)->get(route('customers.show', $stranger))->assertNotFound();
    }

    public function test_reports_index_returns_summary_and_top_items(): void
    {
        [$owner, $business] = $this->owner();
        $order = Order::factory()->create([
            'business_id' => $business->id,
            'payment_status' => 'paid',
            'total' => 4000,
            'placed_at' => now(),
        ]);
        OrderItem::factory()->create(['order_id' => $order->id, 'name' => 'Jollof Rice', 'quantity' => 3]);

        $this->actingAs($owner)
            ->get(route('reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/Reports')
                ->where('summary.orders', 1)
                ->where('summary.revenue', fn ($v) => (float) $v === 4000.0)
                ->has('topItems', 1)
                ->where('topItems.0.name', 'Jollof Rice')
            );
    }

    public function test_reports_export_returns_csv(): void
    {
        [$owner, $business] = $this->owner();
        $order = Order::factory()->create(['business_id' => $business->id, 'placed_at' => now()]);

        $response = $this->actingAs($owner)->get(route('reports.export'));

        $response->assertOk();
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));
        $this->assertStringContainsString($order->order_number, $response->streamedContent());
    }

    public function test_customer_cannot_reach_reports(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']));

        $this->get(route('reports.index'))->assertForbidden();
    }
}
