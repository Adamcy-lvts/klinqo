<?php

namespace App\Http\Controllers\Api\Auth;

use App\Enums\OtpPurpose;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class RegisterController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    /**
     * Register a new customer after their phone has been OTP-verified.
     */
    public function store(RegisterRequest $request): JsonResponse
    {
        $phone = (string) $request->string('phone');

        if (! $this->otp->hasVerifiedPass($phone, OtpPurpose::Registration->value)) {
            throw ValidationException::withMessages([
                'phone' => ['Please verify your phone number before registering.'],
            ]);
        }

        $user = User::create([
            'name' => $request->string('name'),
            'phone' => $phone,
            'email' => $request->input('email'),
            'password' => $request->string('password'),
            'role' => 'customer',
            'is_verified' => true,
        ]);

        $this->otp->consumeVerifiedPass($phone, OtpPurpose::Registration->value);

        $token = $user->createToken($this->deviceName($request->input('device_name')))->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    private function deviceName(mixed $name): string
    {
        return is_string($name) && $name !== '' ? $name : 'mobile';
    }
}
