<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Cache keys + invalidation for the discovery layer (cuisines and per-kitchen
 * menus). Backed by the default cache store (Redis in production).
 */
class DiscoveryCache
{
    /**
     * Cache TTL in seconds (1 hour); menus/cuisines also bust on edits.
     */
    public const TTL = 3600;

    public const CUISINES_KEY = 'discovery:cuisines';

    public static function menuKey(string $businessId): string
    {
        return "discovery:kitchen:{$businessId}:menu";
    }

    public static function forgetCuisines(): void
    {
        Cache::forget(self::CUISINES_KEY);
    }

    public static function forgetMenu(string $businessId): void
    {
        Cache::forget(self::menuKey($businessId));
    }
}
