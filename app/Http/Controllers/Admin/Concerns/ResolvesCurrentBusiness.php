<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\Business;
use Illuminate\Http\Request;

/**
 * Tenant scoping for the kitchen console: resolve the business the current
 * operator manages so an owner only ever sees their own kitchen.
 */
trait ResolvesCurrentBusiness
{
    /**
     * The operator's current kitchen, or null if they have none yet
     * (e.g. an owner mid-onboarding, or an admin without an owned kitchen).
     */
    protected function currentBusiness(Request $request): ?Business
    {
        return $request->user()->businesses()->latest()->first();
    }

    /**
     * The operator's current kitchen, or a 404 when one is required.
     */
    protected function requireBusiness(Request $request): Business
    {
        $business = $this->currentBusiness($request);

        abort_if($business === null, 404, 'No kitchen found for this account.');

        return $business;
    }

    /**
     * Guard that a model belongs to the operator's current kitchen.
     */
    protected function assertBelongsToBusiness(Business $business, string $businessId): void
    {
        abort_unless($business->id === $businessId, 403);
    }
}
