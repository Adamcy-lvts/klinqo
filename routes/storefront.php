<?php

use App\Http\Controllers\Storefront\StorefrontAuthController;
use App\Http\Controllers\Storefront\StorefrontCheckoutController;
use App\Http\Controllers\Storefront\StorefrontController;
use App\Http\Controllers\Storefront\StorefrontOrderController;
use Illuminate\Support\Facades\Route;

/*
| Public customer storefront (web, Inertia, mobile-first). Resolved by the
| kitchen's public business code, e.g. /s/MIRA01.
*/
Route::get('s/{code}', [StorefrontController::class, 'show'])->name('storefront.show');

// Customer auth for checkout: phone + OTP -> web session.
Route::post('storefront/auth/otp', [StorefrontAuthController::class, 'requestOtp'])
    ->middleware('throttle:otp')
    ->name('storefront.auth.otp');
Route::post('storefront/auth/verify', [StorefrontAuthController::class, 'verify'])
    ->middleware('throttle:auth')
    ->name('storefront.auth.verify');

// Checkout (page is public; placing an order requires a logged-in customer).
Route::get('s/{code}/checkout', [StorefrontCheckoutController::class, 'show'])->name('storefront.checkout');
Route::post('s/{code}/checkout', [StorefrontCheckoutController::class, 'store'])
    ->middleware('auth')
    ->name('storefront.checkout.store');

// Payment callback (Paystack redirect) + order tracking.
Route::get('storefront/payment/callback', [StorefrontOrderController::class, 'paymentCallback'])
    ->middleware('auth')
    ->name('storefront.payment.callback');
Route::get('s/{code}/orders/{order}', [StorefrontOrderController::class, 'track'])
    ->middleware('auth')
    ->name('storefront.order.track');
