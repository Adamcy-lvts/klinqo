<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BusinessController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->query('status', 'pending');

        $query = Business::query()->with('owner:id,name,phone')->latest();

        if (is_string($status) && in_array($status, ['pending', 'active', 'suspended'], true)) {
            $query->where('status', $status);
        }

        return Inertia::render('platform/Businesses', [
            'businesses' => $query->paginate(20)->withQueryString(),
            'filters' => ['status' => $status],
            'statusCounts' => Business::query()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
        ]);
    }

    public function approve(Business $business): RedirectResponse
    {
        $business->update([
            'status' => 'active',
            'onboarded_at' => $business->onboarded_at ?? now(),
        ]);

        return back();
    }

    public function suspend(Business $business): RedirectResponse
    {
        $business->update(['status' => 'suspended']);

        return back();
    }

    public function reactivate(Business $business): RedirectResponse
    {
        $business->update(['status' => 'active']);

        return back();
    }

    public function setCommission(Request $request, Business $business): RedirectResponse
    {
        $validated = $request->validate([
            'commission_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $business->update(['commission_percent' => $validated['commission_percent']]);

        return back();
    }
}
