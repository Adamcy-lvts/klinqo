<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchRequest;
use App\Http\Resources\KitchenResource;
use App\Http\Resources\MenuItemResource;
use App\Models\Business;
use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    private const LIMIT = 20;

    /**
     * Cross-kitchen search: kitchens matching by name / cuisine / dish, plus
     * matching menu items (scoped to one kitchen when ?kitchen is given).
     */
    public function index(SearchRequest $request): JsonResponse
    {
        $term = $request->term();
        $like = '%'.$term.'%';

        $kitchens = Business::active()
            ->with('cuisines')
            ->where(fn (Builder $w) => $w
                ->whereRaw('LOWER(name) LIKE ?', [$like])
                ->orWhereHas('cuisines', fn (Builder $c) => $c->whereRaw('LOWER(cuisines.name) LIKE ?', [$like]))
                ->orWhereHas('menuItems', fn (Builder $m) => $m->whereRaw('LOWER(name) LIKE ?', [$like])))
            ->orderByDesc('rating')
            ->limit(self::LIMIT)
            ->get();

        $menuItems = MenuItem::query()
            ->available()
            ->with('business')
            ->whereRaw('LOWER(name) LIKE ?', [$like])
            ->whereHas('business', fn (Builder $b) => $b->where('status', 'active'))
            ->when(
                $request->input('kitchen'),
                fn (Builder $q, $kitchenId) => $q->where('business_id', $kitchenId),
            )
            ->limit(self::LIMIT)
            ->get();

        return response()->json([
            'kitchens' => KitchenResource::collection($kitchens),
            'menu_items' => MenuItemResource::collection($menuItems),
        ]);
    }
}
