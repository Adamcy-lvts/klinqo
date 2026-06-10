<?php

namespace App\Http\Resources;

use App\Models\Business;
use App\Support\Geo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Business
 */
class KitchenResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'business_code' => $this->business_code,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'logo_url' => $this->logo_url,
            'cover_image_url' => $this->cover_image_url,
            'area' => $this->area,
            'address' => $this->address,
            'phone' => $this->phone,
            'email' => $this->email,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'rating' => $this->rating,
            'review_count' => $this->review_count,
            'prep_time_min' => $this->prep_time_min,
            'prep_time_max' => $this->prep_time_max,
            'accepts_online' => $this->accepts_online,
            'accepts_on_delivery' => $this->accepts_on_delivery,
            'accepts_on_pickup' => $this->accepts_on_pickup,
            'operating_hours' => $this->operating_hours,
            'distance_km' => $this->distanceFrom($request),
            'cuisines' => CuisineResource::collection($this->whenLoaded('cuisines')),
            'delivery_methods' => DeliveryMethodResource::collection($this->whenLoaded('deliveryMethods')),
        ];
    }

    /**
     * Straight-line distance (km) from the requester's coordinates, when both
     * the request and the kitchen carry coordinates; otherwise null.
     */
    private function distanceFrom(Request $request): ?float
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');

        if (! is_numeric($lat) || ! is_numeric($lng) || $this->latitude === null || $this->longitude === null) {
            return null;
        }

        return Geo::haversineKm((float) $lat, (float) $lng, (float) $this->latitude, (float) $this->longitude);
    }
}
