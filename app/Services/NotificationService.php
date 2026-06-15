<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function __construct(private readonly FcmService $fcm) {}

    /**
     * Persist an in-app notification and push it to the user's devices.
     *
     * @param  array<string, mixed>  $data
     */
    public function notifyUser(User $user, string $type, string $title, ?string $body = null, array $data = []): Notification
    {
        $notification = $user->appNotifications()->create([
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);

        $tokens = array_values(array_map(
            fn ($token) => (string) $token,
            $user->deviceTokens()->pluck('token')->all(),
        ));

        $this->fcm->send(
            $tokens,
            $title,
            $body,
            [...$data, 'type' => $type, 'notification_id' => $notification->id],
        );

        return $notification;
    }
}
