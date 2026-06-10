<?php

use App\Http\Controllers\Api\Auth\OtpController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\SessionController;
use App\Http\Controllers\Api\CuisineController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\SearchController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    // Public, OTP-driven onboarding + credential flows.
    Route::post('request-otp', [OtpController::class, 'request'])->middleware('throttle:otp');
    Route::post('verify-otp', [OtpController::class, 'verify'])->middleware('throttle:auth');
    Route::post('register', [RegisterController::class, 'store'])->middleware('throttle:auth');
    Route::post('login', [SessionController::class, 'login'])->middleware('throttle:auth');
    Route::post('reset-password', [PasswordResetController::class, 'store'])->middleware('throttle:auth');

    // Authenticated session management.
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('user', [SessionController::class, 'user']);
        Route::post('logout', [SessionController::class, 'logout']);
    });
});

/*
| Discovery & menu (public).
*/
Route::get('cuisines', [CuisineController::class, 'index']);
Route::get('search', [SearchController::class, 'index']);

Route::get('kitchens', [KitchenController::class, 'index']);
Route::get('kitchens/code/{code}', [KitchenController::class, 'resolveByCode']);
Route::get('kitchens/{kitchen}', [KitchenController::class, 'show']);
Route::get('kitchens/{kitchen}/menu', [KitchenController::class, 'menu']);

Route::get('menu-items/{menuItem}', [MenuItemController::class, 'show']);

/*
| Membership (authenticated).
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('kitchens/{kitchen}/join', [KitchenController::class, 'join']);
    Route::get('me/kitchens', [KitchenController::class, 'myKitchens']);
});
