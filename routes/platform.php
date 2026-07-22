<?php

use App\Http\Controllers\Platform\AuthController;
use App\Http\Controllers\Platform\BusinessController;
use App\Http\Controllers\Platform\ConsoleController;
use Illuminate\Support\Facades\Route;

/*
| Platform-admin authentication — a separate login from the kitchen console.
| Guests land here; admins are dropped straight into the Savora console.
*/
Route::prefix('platform')->name('platform.')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('login', [AuthController::class, 'showLogin'])->name('login');
        Route::post('login', [AuthController::class, 'login'])->name('login.store');
    });
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');
});

/*
| Platform admin (web, Inertia). Admin-only: review/approve kitchens,
| suspend/reactivate, and set per-kitchen commission.
*/
Route::middleware(['auth', 'verified', 'admin'])->prefix('platform')->name('platform.')->group(function () {
    // Savora Operations Console — the platform admin panel.
    Route::get('console', [ConsoleController::class, 'index'])->name('console');
    Route::redirect('/', '/platform/console');

    Route::get('businesses', [BusinessController::class, 'index'])->name('businesses.index');
    Route::post('businesses/{business}/approve', [BusinessController::class, 'approve'])->name('businesses.approve');
    Route::post('businesses/{business}/suspend', [BusinessController::class, 'suspend'])->name('businesses.suspend');
    Route::post('businesses/{business}/reactivate', [BusinessController::class, 'reactivate'])->name('businesses.reactivate');
    Route::patch('businesses/{business}/commission', [BusinessController::class, 'setCommission'])->name('businesses.commission');
});
