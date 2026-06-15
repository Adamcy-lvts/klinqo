<?php

namespace Tests\Feature\Api;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_lists_their_notifications_with_unread_count(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        Notification::factory()->count(2)->create(['user_id' => $user->id]);
        Notification::factory()->read()->create(['user_id' => $user->id]);
        Notification::factory()->create(); // another user

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('unread_count', 2);
    }

    public function test_user_can_mark_a_single_notification_read(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        $notification = Notification::factory()->create(['user_id' => $user->id]);

        $this->postJson("/api/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('data.is_read', true);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_read(): void
    {
        Sanctum::actingAs($user = User::factory()->create());
        Notification::factory()->count(3)->create(['user_id' => $user->id]);

        $this->postJson('/api/notifications/read')
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->assertSame(0, $user->appNotifications()->whereNull('read_at')->count());
    }

    public function test_user_cannot_read_another_users_notification(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $foreign = Notification::factory()->create();

        $this->postJson("/api/notifications/{$foreign->id}/read")->assertForbidden();
    }

    public function test_notifications_require_authentication(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
    }
}
