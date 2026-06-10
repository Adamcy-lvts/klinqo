<?php

namespace Tests\Feature\Api;

use App\Events\OrderStatusChanged;
use App\Models\Address;
use App\Models\Business;
use App\Models\Category;
use App\Models\DeliveryMethod;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Business, 1: MenuItem, 2: DeliveryMethod}
     */
    private function makeKitchen(array $attributes = []): array
    {
        $kitchen = Business::factory()->create(array_merge(['commission_percent' => null], $attributes));
        $category = Category::factory()->create(['business_id' => $kitchen->id]);
        $item = MenuItem::factory()->create([
            'business_id' => $kitchen->id,
            'category_id' => $category->id,
            'price' => 2000,
            'is_available' => true,
        ]);
        $delivery = DeliveryMethod::factory()->create([
            'business_id' => $kitchen->id,
            'fee' => 800,
            'is_active' => true,
        ]);

        return [$kitchen, $item, $delivery];
    }

    public function test_customer_can_place_a_cash_pickup_order_and_commission_accrues(): void
    {
        [$kitchen, $item] = $this->makeKitchen();
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/orders', [
            'business_id' => $kitchen->id,
            'delivery_type' => 'pickup',
            'payment_method' => 'pay_on_pickup',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
        ])->assertCreated();

        $order = Order::findOrFail($response->json('data.id'));

        $this->assertEquals(4000, (float) $order->subtotal);
        $this->assertEquals(0, (float) $order->delivery_fee);
        $this->assertEquals(4000, (float) $order->total);
        $this->assertEquals(15, (float) $order->commission_percent);
        $this->assertEquals(600, (float) $order->commission_amount);
        $this->assertSame('placed', $order->status);
        $this->assertSame('pending', $order->payment_status);

        $this->assertDatabaseHas('commission_ledger_entries', [
            'order_id' => $order->id,
            'type' => 'accrual',
            'status' => 'pending',
            'amount' => 600,
        ]);
    }

    public function test_prices_are_taken_from_the_database_not_the_client(): void
    {
        [$kitchen, $item] = $this->makeKitchen();
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/orders', [
            'business_id' => $kitchen->id,
            'delivery_type' => 'pickup',
            'payment_method' => 'pay_on_pickup',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1, 'price' => 1]],
        ])->assertCreated();

        $this->assertEquals(2000, (float) Order::findOrFail($response->json('data.id'))->total);
    }

    public function test_delivery_order_includes_the_delivery_fee(): void
    {
        [$kitchen, $item, $delivery] = $this->makeKitchen();
        $customer = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $customer->id]);
        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/orders', [
            'business_id' => $kitchen->id,
            'delivery_type' => 'delivery',
            'payment_method' => 'pay_on_delivery',
            'delivery_method_id' => $delivery->id,
            'address_id' => $address->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated();

        $order = Order::findOrFail($response->json('data.id'));
        $this->assertEquals(800, (float) $order->delivery_fee);
        $this->assertEquals(2800, (float) $order->total);
    }

    public function test_delivery_order_requires_an_address(): void
    {
        [$kitchen, $item, $delivery] = $this->makeKitchen();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/orders', [
            'business_id' => $kitchen->id,
            'delivery_type' => 'delivery',
            'payment_method' => 'pay_on_delivery',
            'delivery_method_id' => $delivery->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors('address_id');
    }

    public function test_unavailable_items_are_rejected(): void
    {
        [$kitchen, $item] = $this->makeKitchen();
        $item->update(['is_available' => false]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/orders', [
            'business_id' => $kitchen->id,
            'delivery_type' => 'pickup',
            'payment_method' => 'pay_on_pickup',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors('items');
    }

    public function test_payment_method_not_accepted_by_kitchen_is_rejected(): void
    {
        [$kitchen, $item] = $this->makeKitchen(['accepts_online' => false]);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/orders', [
            'business_id' => $kitchen->id,
            'delivery_type' => 'pickup',
            'payment_method' => 'online',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertStatus(422)->assertJsonValidationErrors('payment_method');
    }

    public function test_online_order_has_no_cash_accrual(): void
    {
        [$kitchen, $item] = $this->makeKitchen();
        Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/orders', [
            'business_id' => $kitchen->id,
            'delivery_type' => 'pickup',
            'payment_method' => 'online',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertDatabaseMissing('commission_ledger_entries', [
            'order_id' => $response->json('data.id'),
        ]);
    }

    public function test_kitchen_owner_can_advance_status_and_event_is_broadcast(): void
    {
        Event::fake([OrderStatusChanged::class]);

        [$kitchen, $item] = $this->makeKitchen();
        $order = Order::factory()->create(['business_id' => $kitchen->id, 'status' => 'placed']);
        Sanctum::actingAs($kitchen->owner);

        $this->postJson("/api/orders/{$order->id}/status", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        Event::assertDispatched(OrderStatusChanged::class);
    }

    public function test_illegal_status_transition_is_rejected(): void
    {
        [$kitchen] = $this->makeKitchen();
        $order = Order::factory()->create(['business_id' => $kitchen->id, 'status' => 'placed']);
        Sanctum::actingAs($kitchen->owner);

        $this->postJson("/api/orders/{$order->id}/status", ['status' => 'delivered'])
            ->assertStatus(422)->assertJsonValidationErrors('status');
    }

    public function test_customer_cannot_update_order_status(): void
    {
        [$kitchen] = $this->makeKitchen();
        $order = Order::factory()->create(['business_id' => $kitchen->id, 'status' => 'placed']);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/orders/{$order->id}/status", ['status' => 'confirmed'])->assertForbidden();
    }

    public function test_customer_can_cancel_a_placed_order_and_accrual_is_voided(): void
    {
        [$kitchen, $item] = $this->makeKitchen();
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $created = $this->postJson('/api/orders', [
            'business_id' => $kitchen->id,
            'delivery_type' => 'pickup',
            'payment_method' => 'pay_on_pickup',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated();

        $orderId = $created->json('data.id');

        $this->postJson("/api/orders/{$orderId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('commission_ledger_entries', [
            'order_id' => $orderId,
            'status' => 'void',
        ]);
    }

    public function test_cannot_cancel_once_preparing(): void
    {
        [$kitchen] = $this->makeKitchen();
        $customer = User::factory()->create();
        $order = Order::factory()->create([
            'business_id' => $kitchen->id,
            'user_id' => $customer->id,
            'status' => 'preparing',
        ]);
        Sanctum::actingAs($customer);

        $this->postJson("/api/orders/{$order->id}/cancel")
            ->assertStatus(422)->assertJsonValidationErrors('status');
    }

    public function test_user_cannot_view_another_users_order(): void
    {
        $order = Order::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/orders/{$order->id}")->assertForbidden();
    }

    public function test_orders_index_returns_only_the_users_orders(): void
    {
        $customer = User::factory()->create();
        Order::factory()->count(2)->create(['user_id' => $customer->id]);
        Order::factory()->create();
        Sanctum::actingAs($customer);

        $this->getJson('/api/orders')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_track_returns_a_status_timeline(): void
    {
        $customer = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $customer->id, 'delivery_type' => 'pickup', 'status' => 'preparing']);
        Sanctum::actingAs($customer);

        $this->getJson("/api/orders/{$order->id}/track")
            ->assertOk()
            ->assertJsonPath('status', 'preparing')
            ->assertJsonStructure(['order_number', 'status', 'payment_status', 'steps' => [['status', 'reached', 'current']]]);
    }
}
