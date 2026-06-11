<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    use ResolvesCurrentBusiness;

    public function index(Request $request): Response
    {
        $business = $this->requireBusiness($request);

        $categories = $business->categories()
            ->orderBy('sort_order')
            ->with(['menuItems' => fn ($q) => $q->orderBy('sort_order')])
            ->get();

        return Inertia::render('admin/menu/Index', [
            'categories' => $categories,
        ]);
    }
}
