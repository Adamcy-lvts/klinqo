<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Services\Platform\ConsoleData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Savora Operations Console — the platform admin panel.
 *
 * Renders the design front-end (Overview, Orders, Kitchens, Customers,
 * Payouts, Analytics, Settings) as a single full-screen Inertia page. The
 * UI currently runs on the design's bundled mock data; real platform data
 * is wired in via props in a later phase.
 */
class ConsoleController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('platform/Console', [
            'data' => ConsoleData::for($request->user()),
        ]);
    }
}
