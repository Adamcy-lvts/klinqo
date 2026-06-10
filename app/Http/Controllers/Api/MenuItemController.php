<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;

class MenuItemController extends Controller
{
    /**
     * Show a single available menu item (with its kitchen).
     */
    public function show(MenuItem $menuItem): MenuItemResource
    {
        $menuItem->load('business');

        abort_unless(
            $menuItem->is_available && $menuItem->business !== null && $menuItem->business->status === 'active',
            404,
        );

        return new MenuItemResource($menuItem);
    }
}
