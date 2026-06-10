<?php

namespace Tests\Feature\Api;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'sk_test_secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.paystack.secret' => self::SECRET]);
    }

    public function test_initialize_returns_access_code_and_persists_reference(): void
    {
        Http::fake([
            '*/transaction/initialize' => Http::response([
                'status' => true,
                'data' => ['authorization_url' => 'https://paystack/pay', 'access_code' => 'acc_123'],
            ]),
        ]);

        $customer = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'payment_method' => 'online',
            'payment_status' => 'pending',
        ]);
        Sanctum::actingAs($customer);

        $response = $this->postJson('/api/payments/initialize', ['order_id' => $order->id])
            ->assertOk()
            ->assertJsonStructure(['authorization_url', 'access_code', 'reference']);

        $this->assertSame($response->json('reference'), $order->fresh()->payment_reference);
    }

    public function test_initialize_rejects_a_cash_order(): void
    {
        $customer = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'payment_method' => 'pay_on_delivery',
            'payment_status' => 'pending',
        ]);
        Sanctum::actingAs($customer);

        $this->postJson('/api/payments/initialize', ['order_id' => $order->id])
            ->assertStatus(422)->assertJsonValidationErrors('order_id');
    }

    public function test_initialize_is_forbidden_for_another_users_order(): void
    {
        $order = Order::factory()->create(['payment_method' => 'online', 'payment_status' => 'pending']);
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/payments/initialize', ['order_id' => $order->id])->assertForbidden();
    }

    public function test_webhook_marks_order_paid_and_confirmed(): void
    {
        $order = Order::factory()->create([
            'payment_method' => 'online',
            'payment_status' => 'pending',
            'status' => 'placed',
            'payment_reference' => 'REF_123',
        ]);

        $this->sendWebhook('charge.success', 'REF_123')->assertOk();

        $order->refresh();
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('confirmed', $order->status);
    }

    public function test_webhook_is_idempotent_on_retries(): void
    {
        $order = Order::factory()->create([
            'payment_method' => 'online',
            'payment_status' => 'pending',
            'status' => 'placed',
            'payment_reference' => 'REF_DUP',
        ]);

        $this->sendWebhook('charge.success', 'REF_DUP')->assertOk();
        $this->sendWebhook('charge.success', 'REF_DUP')->assertOk();

        $order->refresh();
        $this->assertSame('paid', $order->payment_status);
        $this->assertSame('confirmed', $order->status);
    }

    public function test_webhook_rejects_an_invalid_signature(): void
    {
        $order = Order::factory()->create(['payment_status' => 'pending', 'payment_reference' => 'REF_X']);

        $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'REF_X']]);

        $this->call('POST', '/api/webhooks/paystack', [], [], [], [
            'HTTP_X_PAYSTACK_SIGNATURE' => 'wrong-signature',
            'CONTENT_TYPE' => 'application/json',
        ], $payload)->assertStatus(401);

        $this->assertSame('pending', $order->fresh()->payment_status);
    }

    public function test_verify_fallback_marks_order_paid(): void
    {
        Http::fake([
            '*/transaction/verify/*' => Http::response([
                'status' => true,
                'data' => ['status' => 'success', 'reference' => 'REF_V'],
            ]),
        ]);

        $customer = User::factory()->create();
        $order = Order::factory()->create([
            'user_id' => $customer->id,
            'payment_method' => 'online',
            'payment_status' => 'pending',
            'status' => 'placed',
            'payment_reference' => 'REF_V',
        ]);
        Sanctum::actingAs($customer);

        $this->postJson('/api/payments/REF_V/verify', [])
            ->assertOk()
            ->assertJsonPath('payment_status', 'paid');

        $this->assertSame('confirmed', $order->fresh()->status);
    }

    private function sendWebhook(string $event, string $reference): TestResponse
    {
        $payload = json_encode(['event' => $event, 'data' => ['reference' => $reference]]);
        $signature = hash_hmac('sha512', (string) $payload, self::SECRET);

        return $this->call('POST', '/api/webhooks/paystack', [], [], [], [
            'HTTP_X_PAYSTACK_SIGNATURE' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ], (string) $payload);
    }
}
