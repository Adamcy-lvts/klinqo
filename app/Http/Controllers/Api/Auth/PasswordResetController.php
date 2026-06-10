<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpPurpose;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    /**
     * Set a new password after the phone has been OTP-verified for reset.
     */
    public function store(ResetPasswordRequest $request): JsonResponse
    {
        $phone = (string) $request->string('phone');

        if (! $this->otp->hasVerifiedPass($phone, OtpPurpose::PasswordReset->value)) {
            throw ValidationException::withMessages([
                'phone' => ['Please verify your phone number before resetting your password.'],
            ]);
        }

        $user = User::query()->where('phone', $phone)->first();

        if ($user === null) {
            throw ValidationException::withMessages([
                'phone' => ['No account found for this phone number.'],
            ]);
        }

        $user->update(['password' => $request->string('password')]);

        // Invalidate the verified pass and any existing API tokens.
        $this->otp->consumeVerifiedPass($phone, OtpPurpose::PasswordReset->value);
        $user->tokens()->delete();

        return response()->json(['message' => 'Password has been reset. Please log in.']);
    }
}
