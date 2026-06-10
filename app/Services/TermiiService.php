<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TermiiService
{
    /**
     * Send a plain SMS via Termii. When no API key is configured (local dev)
     * the message is logged instead of dispatched, so the OTP flow stays
     * usable without live credentials.
     */
    public function sendSms(string $to, string $message): bool
    {
        $apiKey = config('services.termii.key');

        if (empty($apiKey)) {
            Log::info('Termii disabled; SMS not sent.', ['to' => $to, 'message' => $message]);

            return true;
        }

        $response = Http::acceptJson()
            ->post(rtrim((string) config('services.termii.base_url'), '/').'/api/sms/send', [
                'api_key' => $apiKey,
                'to' => $to,
                'from' => config('services.termii.sender_id'),
                'sms' => $message,
                'type' => 'plain',
                'channel' => config('services.termii.channel'),
            ]);

        if ($response->failed()) {
            Log::error('Termii SMS send failed.', [
                'to' => $to,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $response->successful();
    }
}
