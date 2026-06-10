<?php

namespace App\Http\Resources;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'delivery_type' => $this->delivery_type,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'payment_reference' => $this->payment_reference,
            'subtotal' => $this->subtotal,
            'delivery_fee' => $this->delivery_fee,
            'total' => $this->total,
            'note' => $this->note,
            'placed_at' => $this->placed_at,
            'created_at' => $this->created_at,

            // Commission economics are only exposed to the kitchen owner / admin.
            'commission_percent' => $this->when($this->canSeeCommission($request), $this->commission_percent),
            'commission_amount' => $this->when($this->canSeeCommission($request), $this->commission_amount),

            'kitchen' => new KitchenResource($this->whenLoaded('business')),
            'delivery_method' => new DeliveryMethodResource($this->whenLoaded('deliveryMethod')),
            'address' => new AddressResource($this->whenLoaded('address')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
        ];
    }

    private function canSeeCommission(Request $request): bool
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return false;
        }

        return $user->isAdmin() || $this->business?->owner_user_id === $user->id;
    }
}
