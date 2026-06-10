<?php

namespace App\Http\Resources;

use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MenuItem
 */
class MenuItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price,
            'image_url' => $this->image_url,
            'prep_minutes' => $this->prep_minutes,
            'is_available' => $this->is_available,
            'is_popular' => $this->is_popular,
            'sort_order' => $this->sort_order,
            'kitchen' => new KitchenResource($this->whenLoaded('business')),
        ];
    }
}
