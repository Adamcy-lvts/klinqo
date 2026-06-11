<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// A kitchen's live order feed: owner of that kitchen or a platform admin.
Broadcast::channel('orders.{businessId}', function (User $user, string $businessId) {
    if ($user->isAdmin()) {
        return true;
    }

    return Business::where('id', $businessId)->where('owner_user_id', $user->id)->exists();
});

// A customer's personal channel (order status updates).
Broadcast::channel('users.{userId}', fn (User $user, string $userId) => $user->id === $userId);
