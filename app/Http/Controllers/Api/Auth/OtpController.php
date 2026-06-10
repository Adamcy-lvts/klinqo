<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpPurpose;
use App\Exceptions\OtpThrottleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RequestOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class OtpController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    /**
     * Issue an OTP for registration, login or password reset.
     */
    public function request(RequestOtpRequest $request): JsonResponse
    {
        $phone = $request->phone();
        $purpose = $request->purpose();

        $this->guardPhoneForPurpose($phone, $purpose);

        try {
            $result = $this->otp->request($phone, $purpose->value);
        } catch (OtpThrottleException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'retry_after' => $e->retryAfter,
            ], 429);
        }

        return response()->json([
            'message' => 'Verification code sent.',
            'expires_in' => $result['expires_in'],
            'resend_in' => $result['resend_in'],
        ]);
    }

    /**
     * Verify a submitted OTP code.
     */
    public function verify(VerifyOtpRequest $request): JsonResponse
    {
        $verified = $this->otp->verify($request->phone(), $request->purpose()->value, $request->code());

        if (! $verified) {
            throw ValidationException::withMessages([
                'code' => ['The verification code is invalid or has expired.'],
            ]);
        }

        return response()->json(['verified' => true]);
    }

    /**
     * Reject requests that don't make sense for the purpose: registering an
     * existing phone, or logging in / resetting a non-existent one.
     */
    private function guardPhoneForPurpose(string $phone, OtpPurpose $purpose): void
    {
        $exists = User::query()->where('phone', $phone)->exists();

        if ($purpose === OtpPurpose::Registration && $exists) {
            throw ValidationException::withMessages([
                'phone' => ['This phone number is already registered.'],
            ]);
        }

        if (in_array($purpose, [OtpPurpose::Login, OtpPurpose::PasswordReset], true) && ! $exists) {
            throw ValidationException::withMessages([
                'phone' => ['No account found for this phone number.'],
            ]);
        }
    }
}
