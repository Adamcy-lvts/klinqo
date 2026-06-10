<?php

namespace App\Http\Resources;

use App\Models\DeliveryMethod;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin DeliveryMethod
 */
class DeliveryMethodResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'fee' => $this->fee,
            'sort_order' => $this->sort_order,
        ];
    }
}
