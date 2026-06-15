<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Support\DiscoveryCache;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    /**
     * Public mobile storefront for a kitchen, resolved by its business code.
     */
    public function show(string $code): Response
    {
        $kitchen = Business::active()
            ->with(['cuisines', 'deliveryMethods' => fn ($q) => $q->active()->orderBy('sort_order')])
            ->where('business_code', strtoupper($code))
            ->firstOrFail();

        $categories = Cache::remember(
            DiscoveryCache::menuKey($kitchen->id),
            DiscoveryCache::TTL,
            fn () => $kitchen->categories()
                ->active()
                ->orderBy('sort_order')
                ->with(['menuItems' => fn ($q) => $q->available()->orderBy('sort_order')])
                ->get(),
        );

        return Inertia::render('storefront/Show', [
            'kitchen' => [
                'id' => $kitchen->id,
                'name' => $kitchen->name,
                'business_code' => $kitchen->business_code,
                'tagline' => $kitchen->tagline,
                'description' => $kitchen->description,
                'logo_url' => $kitchen->logo_url,
                'cover_image_url' => $kitchen->cover_image_url,
                'area' => $kitchen->area,
                'rating' => $kitchen->rating,
                'review_count' => $kitchen->review_count,
                'prep_time_min' => $kitchen->prep_time_min,
                'prep_time_max' => $kitchen->prep_time_max,
                'accepts_online' => $kitchen->accepts_online,
                'accepts_on_delivery' => $kitchen->accepts_on_delivery,
                'accepts_on_pickup' => $kitchen->accepts_on_pickup,
                'cuisines' => $kitchen->cuisines->map(fn ($c) => ['id' => $c->id, 'name' => $c->name, 'emoji' => $c->emoji]),
                'delivery_methods' => $kitchen->deliveryMethods->map(fn ($m) => [
                    'id' => $m->id, 'name' => $m->name, 'description' => $m->description, 'fee' => $m->fee,
                ]),
            ],
            'categories' => $categories,
            'reviews' => $kitchen->reviews()
                ->visible()
                ->with('user:id,name')
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn ($review) => [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'text' => $review->text,
                    'customer_name' => $review->user->name,
                    'created_at' => $review->created_at,
                ]),
        ]);
    }
}
