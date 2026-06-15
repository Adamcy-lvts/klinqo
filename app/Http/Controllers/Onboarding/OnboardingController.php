<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Cuisine;
use App\Services\PaystackService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /** Ordered onboarding steps. */
    private const STEPS = ['details', 'location', 'cuisines', 'payout', 'submitted'];

    public function __construct(private readonly PaystackService $paystack) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $business = $this->draft($request);

        if ($business !== null && $business->status === 'active') {
            return redirect()->route('dashboard');
        }

        $business?->load('cuisines:id');

        return Inertia::render('onboarding/Wizard', [
            'business' => $business,
            'step' => $business->onboarding_step ?? 'details',
            'allCuisines' => Cuisine::query()->orderBy('name')->get(['id', 'name', 'emoji']),
            'selectedCuisines' => $business?->cuisines->pluck('id') ?? [],
        ]);
    }

    public function storeDetails(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $business = $this->draft($request);

        if ($business === null) {
            $request->user()->businesses()->create([
                ...$data,
                'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(4)),
                'business_code' => Business::generateBusinessCode(),
                'status' => 'pending',
                'onboarding_step' => 'location',
            ]);

            $request->user()->update(['role' => 'business_owner']);
        } else {
            $business->update([...$data, 'onboarding_step' => $this->advance($business, 'location')]);
        }

        return redirect()->route('onboarding.index');
    }

    public function storeLocation(Request $request): RedirectResponse
    {
        $business = $this->requireDraft($request);

        $data = $request->validate([
            'address' => ['required', 'string', 'max:500'],
            'area' => ['required', 'string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'operating_hours' => ['nullable', 'array'],
        ]);

        $business->update([...$data, 'onboarding_step' => $this->advance($business, 'cuisines')]);

        return redirect()->route('onboarding.index');
    }

    public function storeCuisines(Request $request): RedirectResponse
    {
        $business = $this->requireDraft($request);

        $data = $request->validate([
            'cuisines' => ['required', 'array', 'min:1'],
            'cuisines.*' => ['uuid', 'exists:cuisines,id'],
        ]);

        $business->cuisines()->sync($data['cuisines']);
        $business->update(['onboarding_step' => $this->advance($business, 'payout')]);

        return redirect()->route('onboarding.index');
    }

    public function storePayout(Request $request): RedirectResponse
    {
        $business = $this->requireDraft($request);

        $data = $request->validate([
            'bank_name' => ['required', 'string', 'max:100'],
            'bank_code' => ['required', 'string', 'max:10'],
            'account_number' => ['required', 'string', 'max:20'],
            'account_name' => ['required', 'string', 'max:255'],
        ]);

        $subaccountCode = $this->paystack->createSubaccount(
            $business->name,
            $data['bank_code'],
            $data['account_number'],
            $business->effectiveCommissionPercent(),
        );

        $business->update([
            'bank_name' => $data['bank_name'],
            'bank_account_number' => $data['account_number'],
            'bank_account_name' => $data['account_name'],
            'paystack_subaccount_code' => $subaccountCode,
            'onboarding_step' => 'submitted',
        ]);

        return redirect()->route('onboarding.index');
    }

    private function draft(Request $request): ?Business
    {
        return $request->user()->businesses()->latest()->first();
    }

    private function requireDraft(Request $request): Business
    {
        $business = $this->draft($request);

        abort_if($business === null, 409, 'Start with your business details first.');

        return $business;
    }

    /**
     * Advance the persisted step without regressing if the owner edits an
     * earlier step.
     */
    private function advance(Business $business, string $to): string
    {
        $current = array_search($business->onboarding_step, self::STEPS, true);
        $target = array_search($to, self::STEPS, true);

        return ($current !== false && $current > $target) ? (string) $business->onboarding_step : $to;
    }
}
