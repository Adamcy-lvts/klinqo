<?php

namespace Tests\Feature\Storefront;

use App\Models\Business;
use App\Models\Category;
use App\Models\DeliveryMethod;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        config(['services.paystack.secret' => 'sk_test', 'services.paystack.base_url' => 'https://api.paystack.co']);
    }

    /**
     * @return array{0: Business, 1: MenuItem, 2: DeliveryMethod}
     */
    private function makeKitchen(): array
    {
        $kitchen = Business::factory()->create([
            'business_code' => 'MIRA01',
            'accepts_online' => true,
            'accepts_on_delivery' => true,
            'accepts_on_pickup' => true,
            'commission_percent' => 15,
        ]);
        $category = Category::factory()->create(['business_id' => $kitchen->id]);
        $item = MenuItem::factory()->create(['business_id' => $kitchen->id, 'category_id' => $category->id, 'price' => 2500, 'is_available' => true]);
        $method = DeliveryMethod::factory()->create(['business_id' => $kitchen->id, 'fee' => 800, 'is_active' => true]);

        return [$kitchen, $item, $method];
    }

    public function test_checkout_page_loads_publicly(): void
    {
        [$kitchen] = $this->makeKitchen();

        $this->get(route('storefront.checkout', 'MIRA01'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('storefront/Checkout')
                ->has('kitchen.delivery_methods', 1)
            );
    }

    public function test_guest_cannot_place_an_order(): void
    {
        [$kitchen, $item] = $this->makeKitchen();

        $this->post(route('storefront.checkout.store', 'MIRA01'), [
            'delivery_type' => 'pickup',
            'payment_method' => 'pay_on_pickup',
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertRedirect(route('login'));

        $this->assertSame(0, Order::count());
    }

    public function test_customer_can_place_a_cash_pickup_order(): void
    {
        [$kitchen, $item] = $this->makeKitchen();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('storefront.checkout.store', 'MIRA01'), [
                'delivery_type' => 'pickup',
                'payment_method' => 'pay_on_pickup',
                'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
            ])
            ->assertRedirect();

        $order = Order::firstWhere('user_id', $user->id);
        $this->assertNotNull($order);
        $this->assertSame('5000.00', $order->total);
        $this->assertSame('placed', $order->status);
        $this->assertDatabaseHas('commission_ledger_entries', ['order_id' => $order->id, 'status' => 'pending']);
    }

    public function test_delivery_order_captures_a_new_address(): void
    {
        [$kitchen, $item, $method] = $this->makeKitchen();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('storefront.checkout.store', 'MIRA01'), [
                'delivery_type' => 'delivery',
                'payment_method' => 'pay_on_delivery',
                'delivery_method_id' => $method->id,
                'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
                'address_line' => '14 Allen Avenue, Ikeja',
                'address_phone' => '+2348012345678',
            ])
            ->assertRedirect();

        $order = Order::firstWhere('user_id', $user->id);
        $this->assertSame('800.00', $order->delivery_fee);
        $this->assertDatabaseHas('addresses', ['user_id' => $user->id, 'address_line' => '14 Allen Avenue, Ikeja']);
    }

    public function test_online_order_redirects_to_paystack(): void
    {
        Http::fake([
            'api.paystack.co/transaction/initialize' => Http::response([
                'data' => ['authorization_url' => 'https://checkout.paystack.com/xyz', 'access_code' => 'acc_1'],
            ], 200),
        ]);

        [$kitchen, $item] = $this->makeKitchen();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('storefront.checkout.store', 'MIRA01'), [
                'delivery_type' => 'pickup',
                'payment_method' => 'online',
                'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
            ])
            ->assertRedirect('https://checkout.paystack.com/xyz');

        $this->assertNotNull(Order::firstWhere('user_id', $user->id)->payment_reference);
    }

    public function test_tracking_page_is_scoped_to_the_customer(): void
    {
        [$kitchen] = $this->makeKitchen();
        $user = User::factory()->create();
        $order = Order::factory()->create(['business_id' => $kitchen->id, 'user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('storefront.order.track', ['code' => 'MIRA01', 'order' => $order->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('storefront/OrderTracking')->has('steps'));

        $this->actingAs(User::factory()->create())
            ->get(route('storefront.order.track', ['code' => 'MIRA01', 'order' => $order->id]))
            ->assertForbidden();
    }

    public function test_payment_callback_verifies_and_marks_paid(): void
    {
        Http::fake([
            'api.paystack.co/transaction/verify/*' => Http::response(['data' => ['status' => 'success']], 200),
        ]);

        [$kitchen] = $this->makeKitchen();
        $user = User::factory()->create();
        $order = Order::factory()->create([
            'business_id' => $kitchen->id,
            'user_id' => $user->id,
            'payment_method' => 'online',
            'payment_status' => 'pending',
            'status' => 'placed',
            'payment_reference' => 'REF123',
        ]);

        $this->actingAs($user)
            ->get(route('storefront.payment.callback', ['reference' => 'REF123']))
            ->assertRedirect(route('storefront.order.track', ['code' => 'MIRA01', 'order' => $order->id]));

        $order->refresh();
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('confirmed', $order->status);
    }
}
