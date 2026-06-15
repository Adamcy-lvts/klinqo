<?php

namespace Tests\Feature\Api;

use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeviceTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_register_a_device_token(): void
    {
        Sanctum::actingAs($user = User::factory()->create());

        $this->postJson('/api/devices', ['token' => 'fcm-abc', 'platform' => 'android'])
            ->assertCreated();

        $this->assertDatabaseHas('device_tokens', [
            'user_id' => $user->id,
            'token' => 'fcm-abc',
            'platform' => 'android',
        ]);
    }

    public function test_registering_the_same_token_updates_rather_than_duplicates(): void
    {
        $first = User::factory()->create();
        DeviceToken::factory()->create(['user_id' => $first->id, 'token' => 'shared-token']);

        Sanctum::actingAs($second = User::factory()->create());
        $this->postJson('/api/devices', ['token' => 'shared-token', 'platform' => 'ios'])->assertCreated();

        $this->assertSame(1, DeviceToken::where('token', 'shared-token')->count());
        $this->assertDatabaseHas('device_tokens', ['token' => 'shared-token', 'user_id' => $second->id]);
    }

    public function test_a_user_can_remove_a_device_token(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        DeviceToken::factory()->create(['user_id' => $user->id, 'token' => 'to-remove']);

        $this->deleteJson('/api/devices', ['token' => 'to-remove'])->assertOk();

        $this->assertDatabaseMissing('device_tokens', ['token' => 'to-remove']);
    }

    public function test_registering_a_device_requires_authentication(): void
    {
        $this->postJson('/api/devices', ['token' => 'fcm-abc'])->assertUnauthorized();
    }
}
