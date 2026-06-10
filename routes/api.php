<?php

use App\Http\Controllers\Api\Auth\OtpController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\SessionController;
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
