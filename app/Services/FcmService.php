<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    /**
     * Send a push notification to a set of device tokens. When no FCM key is
     * configured (local dev) the payload is logged instead of dispatched.
     * Tokens FCM reports as invalid are pruned.
     *
     * @param  list<string>  $tokens
     * @param  array<string, mixed>  $data
     */
    public function send(array $tokens, string $title, ?string $body, array $data = []): void
    {
        $tokens = array_values(array_filter($tokens));

        if ($tokens === []) {
            return;
        }

        $key = config('services.fcm.key');

        if (empty($key)) {
            Log::info('FCM disabled; push not sent.', ['tokens' => count($tokens), 'title' => $title]);

            return;
        }

        $response = Http::withHeaders(['Authorization' => 'key='.$key])
            ->acceptJson()
            ->post((string) config('services.fcm.url'), [
                'registration_ids' => $tokens,
                'notification' => ['title' => $title, 'body' => $body],
                'data' => array_map(fn ($value) => is_scalar($value) ? (string) $value : json_encode($value), $data),
            ]);

        if ($response->failed()) {
            Log::error('FCM push failed.', ['status' => $response->status()]);

            return;
        }

        $this->pruneInvalidTokens($tokens, (array) $response->json('results', []));
    }

    /**
     * @param  list<string>  $tokens
     * @param  array<int, array<string, mixed>>  $results
     */
    private function pruneInvalidTokens(array $tokens, array $results): void
    {
        $invalid = [];

        foreach ($results as $index => $result) {
            $error = $result['error'] ?? null;

            if (in_array($error, ['NotRegistered', 'InvalidRegistration'], true) && isset($tokens[$index])) {
                $invalid[] = $tokens[$index];
            }
        }

        if ($invalid !== []) {
            DeviceToken::whereIn('token', $invalid)->delete();
        }
    }
}
