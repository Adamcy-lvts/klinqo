<?php

use App\Http\Controllers\Onboarding\OnboardingController;
use Illuminate\Support\Facades\Route;

/*
| Business self-onboarding (web, Inertia). Any authenticated user can create
| a kitchen; it stays pending until a platform admin approves it.
*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'index'])->name('onboarding.index');
    Route::post('onboarding/details', [OnboardingController::class, 'storeDetails'])->name('onboarding.details');
    Route::post('onboarding/location', [OnboardingController::class, 'storeLocation'])->name('onboarding.location');
    Route::post('onboarding/cuisines', [OnboardingController::class, 'storeCuisines'])->name('onboarding.cuisines');
    Route::post('onboarding/payout', [OnboardingController::class, 'storePayout'])->name('onboarding.payout');
});
