<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kitchen Console — the operator's single-kitchen panel.
 *
 * Renders the Savora Kitchen design front-end (Dashboard, Orders, Menu,
 * Delivery methods, Customers, Reviews, Reports, Settings) as a single
 * full-screen Inertia page with client-side section routing. It currently
 * runs on the design's bundled mock data — the green-accented sibling of the
 * platform Operations Console; real tenant-scoped data is wired in via props
 * in a later phase.
 */
class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('admin/KitchenConsole');
    }
}
