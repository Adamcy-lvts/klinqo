<?php

namespace App\Http\Controllers\Storefront;

use App\Enums\OtpPurpose;
use App\Exceptions\OtpThrottleException;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StorefrontAuthController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    /**
     * Send an OTP for storefront checkout (works for new or existing phones).
     */
    public function requestOtp(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+?[0-9]{7,15}$/'],
        ]);

        try {
            $this->otp->request($data['phone'], OtpPurpose::Storefront->value);
        } catch (OtpThrottleException $e) {
            throw ValidationException::withMessages([
                'phone' => ["Please wait {$e->retryAfter} seconds before requesting another code."],
            ]);
        }

        return back();
    }

    /**
     * Verify the OTP, find-or-create the customer, and log them into the
     * web session so they can place an order.
     */
    public function verify(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'regex:/^\+?[0-9]{7,15}$/'],
            'code' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        if (! $this->otp->verify($data['phone'], OtpPurpose::Storefront->value, $data['code'])) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid or has expired.'],
            ]);
        }

        $user = User::firstOrCreate(
            ['phone' => $data['phone']],
            [
                'name' => ($data['name'] ?? null) ?: 'Customer',
                'role' => 'customer',
                'is_verified' => true,
                'password' => Hash::make(Str::random(40)),
            ],
        );

        $this->otp->consumeVerifiedPass($data['phone'], OtpPurpose::Storefront->value);

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return back();
    }
}
