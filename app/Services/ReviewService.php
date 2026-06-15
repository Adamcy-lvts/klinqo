<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    /**
     * Submit a review for a delivered order. One review per order; the
     * kitchen's cached rating is recomputed via the Review model events.
     *
     * @throws ValidationException
     */
    public function submit(Order $order, User $user, int $rating, ?string $text): Review
    {
        if ($order->status !== Order::STATUS_DELIVERED) {
            throw ValidationException::withMessages([
                'order' => ['You can only review a delivered order.'],
            ]);
        }

        if ($order->review()->exists()) {
            throw ValidationException::withMessages([
                'order' => ['This order has already been reviewed.'],
            ]);
        }

        return $order->review()->create([
            'business_id' => $order->business_id,
            'user_id' => $user->id,
            'rating' => $rating,
            'text' => $text,
        ]);
    }
}
