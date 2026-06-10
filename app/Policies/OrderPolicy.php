<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Customer who placed it, the kitchen owner, or an admin may view.
     */
    public function view(User $user, Order $order): bool
    {
        return $this->owns($user, $order) || $this->ownsKitchen($user, $order) || $user->isAdmin();
    }

    /**
     * Only the customer who placed the order may cancel it.
     */
    public function cancel(User $user, Order $order): bool
    {
        return $this->owns($user, $order);
    }

    /**
     * Only the kitchen owner (or admin) may advance the status.
     */
    public function updateStatus(User $user, Order $order): bool
    {
        return $this->ownsKitchen($user, $order) || $user->isAdmin();
    }

    /**
     * Only the customer who placed the order may pay for it.
     */
    public function pay(User $user, Order $order): bool
    {
        return $this->owns($user, $order);
    }

    private function owns(User $user, Order $order): bool
    {
        return $order->user_id === $user->id;
    }

    private function ownsKitchen(User $user, Order $order): bool
    {
        return $order->business()->where('owner_user_id', $user->id)->exists();
    }
}
