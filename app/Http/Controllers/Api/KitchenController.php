<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\KitchenResource;
use App\Models\Business;
use App\Models\Category;
use App\Support\DiscoveryCache;
use App\Support\Geo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class KitchenController extends Controller
{
    /**
     * List / search active kitchens with cuisine filtering and sorting.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = $this->filtered($request);
        $perPage = $this->perPage($request);

        if ($request->query('sort') === 'distance' && $this->hasCoordinates($request)) {
            return $this->paginateByDistance($request, $query, $perPage);
        }

        match ($request->query('sort')) {
            'newest' => $query->latest(),
            default => $query->orderByDesc('rating')->orderByDesc('review_count'),
        };

        return KitchenResource::collection(
            $query->paginate($perPage)->appends($request->query())
        );
    }

    /**
     * Show a single active kitchen with cuisines and delivery methods.
     */
    public function show(Business $kitchen): KitchenResource
    {
        abort_unless($kitchen->status === 'active', 404);

        $kitchen->load(['cuisines', 'deliveryMethods' => fn ($q) => $q->active()->orderBy('sort_order')]);

        return new KitchenResource($kitchen);
    }

    /**
     * Resolve a kitchen by its public business code (QR / share link).
     */
    public function resolveByCode(string $code): KitchenResource
    {
        $kitchen = Business::active()
            ->with(['cuisines', 'deliveryMethods' => fn ($q) => $q->active()->orderBy('sort_order')])
            ->where('business_code', $code)
            ->firstOrFail();

        return new KitchenResource($kitchen);
    }

    /**
     * The kitchen's menu: active categories with their available items (cached).
     */
    public function menu(Request $request, Business $kitchen): AnonymousResourceCollection
    {
        abort_unless($kitchen->status === 'active', 404);

        /** @var Collection<int, Category> $categories */
        $categories = Cache::remember(
            DiscoveryCache::menuKey($kitchen->id),
            DiscoveryCache::TTL,
            fn () => $kitchen->categories()
                ->active()
                ->orderBy('sort_order')
                ->with(['menuItems' => fn ($q) => $q->available()->orderBy('sort_order')])
                ->get(),
        );

        if ($q = $this->searchTerm($request)) {
            $categories = $categories
                ->map(function ($category) use ($q) {
                    $category->setRelation(
                        'menuItems',
                        $category->menuItems->filter(fn ($item) => str_contains(mb_strtolower($item->name), $q))->values()
                    );

                    return $category;
                })
                ->filter(fn ($category) => $category->menuItems->isNotEmpty())
                ->values();
        }

        return CategoryResource::collection($categories);
    }

    /**
     * Join a kitchen (idempotent). Requires authentication.
     */
    public function join(Request $request, Business $kitchen): JsonResponse
    {
        abort_unless($kitchen->status === 'active', 404);

        $request->user()->memberships()->syncWithoutDetaching([
            $kitchen->id => ['joined_at' => now()],
        ]);

        return response()->json([
            'message' => 'Joined kitchen.',
            'kitchen' => new KitchenResource($kitchen->load('cuisines')),
        ]);
    }

    /**
     * Kitchens the authenticated user has joined.
     */
    public function myKitchens(Request $request): AnonymousResourceCollection
    {
        $kitchens = $request->user()
            ->memberships()
            ->where('businesses.status', 'active')
            ->with('cuisines')
            ->orderByDesc('rating')
            ->get();

        return KitchenResource::collection($kitchens);
    }

    /**
     * @return Builder<Business>
     */
    private function filtered(Request $request): Builder
    {
        $query = Business::active()->with('cuisines');

        $cuisine = $request->query('cuisine');
        if (is_string($cuisine) && $cuisine !== '') {
            $query->whereHas('cuisines', fn (Builder $q) => $q
                ->where('cuisines.slug', $cuisine)
                ->orWhere('cuisines.id', $cuisine));
        }

        if ($term = $this->searchTerm($request)) {
            $like = '%'.$term.'%';
            $query->where(fn (Builder $w) => $w
                ->whereRaw('LOWER(name) LIKE ?', [$like])
                ->orWhereHas('cuisines', fn (Builder $c) => $c->whereRaw('LOWER(cuisines.name) LIKE ?', [$like]))
                ->orWhereHas('menuItems', fn (Builder $m) => $m->whereRaw('LOWER(name) LIKE ?', [$like])));
        }

        return $query;
    }

    private function searchTerm(Request $request): ?string
    {
        $q = $request->query('q');

        return is_string($q) && trim($q) !== '' ? mb_strtolower(trim($q)) : null;
    }

    private function perPage(Request $request): int
    {
        $perPage = (int) $request->integer('per_page', 15);

        return max(1, min($perPage, 50));
    }

    private function hasCoordinates(Request $request): bool
    {
        return is_numeric($request->query('lat')) && is_numeric($request->query('lng'));
    }

    /**
     * @param  Builder<Business>  $query
     */
    private function paginateByDistance(Request $request, Builder $query, int $perPage): AnonymousResourceCollection
    {
        $lat = (float) $request->query('lat');
        $lng = (float) $request->query('lng');

        $sorted = $query->get()
            ->sortBy(fn (Business $b) => $b->latitude === null || $b->longitude === null
                ? INF
                : Geo::haversineKm($lat, $lng, (float) $b->latitude, (float) $b->longitude))
            ->values();

        $page = max(1, (int) $request->integer('page', 1));

        $paginator = new LengthAwarePaginator(
            $sorted->slice(($page - 1) * $perPage, $perPage)->values(),
            $sorted->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return KitchenResource::collection($paginator);
    }
}
