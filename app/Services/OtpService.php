<?php

namespace App\Services;

use App\Exceptions\OtpThrottleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    public function __construct(private readonly TermiiService $termii) {}

    /**
     * Generate, store and send an OTP for the given phone + purpose.
     *
     * @return array{expires_in: int, resend_in: int}
     *
     * @throws OtpThrottleException when still within the resend cooldown
     */
    public function request(string $phone, string $purpose): array
    {
        $cooldown = (int) config('klinqo.otp.resend_cooldown');

        if (($remaining = $this->cooldownRemaining($phone, $purpose)) > 0) {
            throw new OtpThrottleException($remaining);
        }

        $code = $this->generateCode();
        $ttl = (int) config('klinqo.otp.ttl');

        Cache::put($this->codeKey($phone, $purpose), [
            'hash' => Hash::make($code),
            'attempts' => 0,
        ], $ttl);

        Cache::put($this->cooldownKey($phone, $purpose), now()->addSeconds($cooldown)->getTimestamp(), $cooldown);

        $this->termii->sendSms($phone, "Your Klinqo verification code is {$code}. It expires in ".(int) ($ttl / 60).' minutes.');

        return ['expires_in' => $ttl, 'resend_in' => $cooldown];
    }

    /**
     * Verify a submitted code. On success the code is consumed and a
     * short-lived "verified" pass is recorded for register / reset flows.
     */
    public function verify(string $phone, string $purpose, string $code): bool
    {
        $key = $this->codeKey($phone, $purpose);

        /** @var array{hash: string, attempts: int}|null $record */
        $record = Cache::get($key);

        if ($record === null) {
            return false;
        }

        if ($record['attempts'] >= (int) config('klinqo.otp.max_attempts')) {
            Cache::forget($key);

            return false;
        }

        if (! Hash::check($code, $record['hash'])) {
            $record['attempts']++;
            Cache::put($key, $record, (int) config('klinqo.otp.ttl'));

            return false;
        }

        Cache::forget($key);
        Cache::forget($this->cooldownKey($phone, $purpose));
        Cache::put($this->verifiedKey($phone, $purpose), true, (int) config('klinqo.otp.verified_ttl'));

        return true;
    }

    /**
     * Whether a phone holds a valid "verified" pass for the purpose.
     */
    public function hasVerifiedPass(string $phone, string $purpose): bool
    {
        return (bool) Cache::get($this->verifiedKey($phone, $purpose), false);
    }

    /**
     * Consume (clear) the verified pass once a register / reset succeeds.
     */
    public function consumeVerifiedPass(string $phone, string $purpose): void
    {
        Cache::forget($this->verifiedKey($phone, $purpose));
    }

    /**
     * Seconds remaining on the resend cooldown, or 0 if none.
     */
    public function cooldownRemaining(string $phone, string $purpose): int
    {
        $expiresAt = Cache::get($this->cooldownKey($phone, $purpose));

        if ($expiresAt === null) {
            return 0;
        }

        return max(0, (int) $expiresAt - now()->getTimestamp());
    }

    private function generateCode(): string
    {
        $length = (int) config('klinqo.otp.length');
        $max = (10 ** $length) - 1;

        return str_pad((string) random_int(0, $max), $length, '0', STR_PAD_LEFT);
    }

    private function codeKey(string $phone, string $purpose): string
    {
        return "otp:{$purpose}:{$phone}";
    }

    private function cooldownKey(string $phone, string $purpose): string
    {
        return "otp_cooldown:{$purpose}:{$phone}";
    }

    private function verifiedKey(string $phone, string $purpose): string
    {
        return "otp_verified:{$purpose}:{$phone}";
    }
}
