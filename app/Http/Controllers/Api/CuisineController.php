<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CuisineResource;
use App\Models\Cuisine;
use App\Support\DiscoveryCache;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;

class CuisineController extends Controller
{
    /**
     * List the cuisine taxonomy (cached).
     */
    public function index(): AnonymousResourceCollection
    {
        $cuisines = Cache::remember(
            DiscoveryCache::CUISINES_KEY,
            DiscoveryCache::TTL,
            fn () => Cuisine::query()->orderBy('name')->get(),
        );

        return CuisineResource::collection($cuisines);
    }
}
