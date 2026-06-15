<?php

use App\Http\Controllers\Platform\BusinessController;
use Illuminate\Support\Facades\Route;

/*
| Platform admin (web, Inertia). Admin-only: review/approve kitchens,
| suspend/reactivate, and set per-kitchen commission.
*/
Route::middleware(['auth', 'verified', 'admin'])->prefix('platform')->name('platform.')->group(function () {
    Route::get('businesses', [BusinessController::class, 'index'])->name('businesses.index');
    Route::post('businesses/{business}/approve', [BusinessController::class, 'approve'])->name('businesses.approve');
    Route::post('businesses/{business}/suspend', [BusinessController::class, 'suspend'])->name('businesses.suspend');
    Route::post('businesses/{business}/reactivate', [BusinessController::class, 'reactivate'])->name('businesses.reactivate');
    Route::patch('businesses/{business}/commission', [BusinessController::class, 'setCommission'])->name('businesses.commission');
});
