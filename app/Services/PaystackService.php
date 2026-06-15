<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class PaystackService
{
    /**
     * Initialize a transaction for an order. When the kitchen has a Paystack
     * subaccount, the platform commission is retained via a transaction split.
     *
     * @return array{authorization_url: ?string, access_code: ?string, reference: string}
     */
    public function initialize(Order $order, ?string $callbackUrl = null): array
    {
        $reference = $this->reference($order);

        $payload = [
            'email' => $order->user->email ?? 'customer+'.$order->user_id.'@klinqo.app',
            'amount' => (int) round(((float) $order->total) * 100),
            'reference' => $reference,
            'metadata' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ],
        ];

        if ($callbackUrl !== null) {
            $payload['callback_url'] = $callbackUrl;
        }

        if (! empty($order->business->paystack_subaccount_code)) {
            $payload['subaccount'] = $order->business->paystack_subaccount_code;
            $payload['transaction_charge'] = (int) round(((float) $order->commission_amount) * 100);
            $payload['bearer'] = 'account';
        }

        $response = Http::withToken((string) config('services.paystack.secret'))
            ->acceptJson()
            ->post($this->url('/transaction/initialize'), $payload);

        if ($response->failed()) {
            throw new RuntimeException('Unable to initialize payment with Paystack.');
        }

        return [
            'authorization_url' => $response->json('data.authorization_url'),
            'access_code' => $response->json('data.access_code'),
            'reference' => $reference,
        ];
    }

    /**
     * Server-side verification fallback for a transaction reference.
     *
     * @return array<string, mixed>
     */
    public function verify(string $reference): array
    {
        $response = Http::withToken((string) config('services.paystack.secret'))
            ->acceptJson()
            ->get($this->url('/transaction/verify/'.$reference));

        if ($response->failed()) {
            throw new RuntimeException('Unable to verify payment with Paystack.');
        }

        /** @var array<string, mixed> $data */
        $data = $response->json('data', []);

        return $data;
    }

    /**
     * Validate the X-Paystack-Signature header against the raw request body.
     */
    public function isValidSignature(string $payload, ?string $signature): bool
    {
        if ($signature === null) {
            return false;
        }

        $expected = hash_hmac('sha512', $payload, (string) config('services.paystack.secret'));

        return hash_equals($expected, $signature);
    }

    /**
     * Create a Paystack subaccount for a kitchen's payouts. The platform's
     * commission is retained via percentage_charge. Returns the subaccount
     * code, or null when Paystack isn't configured (local dev).
     */
    public function createSubaccount(string $businessName, string $bankCode, string $accountNumber, float $percentageCharge): ?string
    {
        $key = config('services.paystack.secret');

        if (empty($key)) {
            Log::info('Paystack disabled; subaccount not created.', ['business' => $businessName]);

            return null;
        }

        $response = Http::withToken((string) $key)
            ->acceptJson()
            ->post($this->url('/subaccount'), [
                'business_name' => $businessName,
                'settlement_bank' => $bankCode,
                'account_number' => $accountNumber,
                'percentage_charge' => $percentageCharge,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Unable to create Paystack subaccount.');
        }

        return $response->json('data.subaccount_code');
    }

    /**
     * Resolve a bank account name, or null when unavailable / not configured.
     *
     * @return array<string, mixed>|null
     */
    public function resolveAccount(string $accountNumber, string $bankCode): ?array
    {
        $key = config('services.paystack.secret');

        if (empty($key)) {
            return null;
        }

        $response = Http::withToken((string) $key)
            ->acceptJson()
            ->get($this->url('/bank/resolve'), [
                'account_number' => $accountNumber,
                'bank_code' => $bankCode,
            ]);

        return $response->successful() ? (array) $response->json('data') : null;
    }

    private function reference(Order $order): string
    {
        return $order->payment_reference ?: 'KLQ_'.Str::upper(Str::random(20));
    }

    private function url(string $path): string
    {
        return rtrim((string) config('services.paystack.base_url'), '/').$path;
    }
}
