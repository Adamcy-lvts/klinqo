<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Services\NotificationService;

class SendOrderStatusNotification
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;
        $user = $order->user;

        if ($user === null) {
            return;
        }

        [$title, $body] = $this->message($order);

        $this->notifications->notifyUser($user, 'order', $title, $body, [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function message(Order $order): array
    {
        $number = $order->order_number;

        return match ($order->status) {
            Order::STATUS_CONFIRMED => ['Order confirmed', "Your order {$number} has been confirmed."],
            Order::STATUS_PREPARING => ['Order being prepared', "{$number} is now being prepared."],
            Order::STATUS_READY => ['Order ready', "{$number} is ready."],
            Order::STATUS_DELIVERING => ['Out for delivery', "{$number} is on its way to you."],
            Order::STATUS_DELIVERED => ['Order delivered', "Enjoy your meal! {$number} has been delivered."],
            Order::STATUS_CANCELLED => ['Order cancelled', "{$number} has been cancelled."],
            default => ['Order update', "{$number} is now {$order->status}."],
        };
    }
}
