<?php

namespace Tests\Feature;

use App\Models\DeviceToken;
use App\Models\Notification;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NotificationFanoutTest extends TestCase
{
    use RefreshDatabase;

    private function transition(Order $order, string $status): void
    {
        app(OrderService::class)->transition($order, $status);
    }

    public function test_status_change_creates_an_in_app_notification_for_the_customer(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);

        $this->transition($order, Order::STATUS_CONFIRMED);

        $notification = Notification::where('user_id', $user->id)->first();
        $this->assertNotNull($notification);
        $this->assertSame('order', $notification->type);
        $this->assertSame('confirmed', $notification->data['status']);
        $this->assertSame($order->id, $notification->data['order_id']);
    }

    public function test_push_is_sent_to_registered_devices_when_fcm_is_configured(): void
    {
        config(['services.fcm.key' => 'server-key']);
        Http::fake(['*' => Http::response(['results' => [['message_id' => '1']]], 200)]);

        $user = User::factory()->create();
        DeviceToken::factory()->create(['user_id' => $user->id, 'token' => 'device-1']);
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'confirmed']);

        $this->transition($order, Order::STATUS_PREPARING);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'fcm')
            && in_array('device-1', $request['registration_ids'], true));
    }

    public function test_invalid_device_tokens_are_pruned_on_send(): void
    {
        config(['services.fcm.key' => 'server-key']);
        Http::fake(['*' => Http::response(['results' => [['error' => 'NotRegistered']]], 200)]);

        $user = User::factory()->create();
        DeviceToken::factory()->create(['user_id' => $user->id, 'token' => 'stale']);
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);

        $this->transition($order, Order::STATUS_CONFIRMED);

        $this->assertDatabaseMissing('device_tokens', ['token' => 'stale']);
    }

    public function test_no_push_is_attempted_without_an_fcm_key(): void
    {
        Http::fake();

        $user = User::factory()->create();
        DeviceToken::factory()->create(['user_id' => $user->id]);
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'placed']);

        $this->transition($order, Order::STATUS_CONFIRMED);

        Http::assertNothingSent();
    }
}
