<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaystackWebhookController extends Controller
{
    public function __construct(
        private readonly PaystackService $paystack,
        private readonly OrderService $orders,
    ) {}

    /**
     * Handle Paystack webhooks. Verifies the signature and, on a successful
     * charge, marks the order paid + confirmed. Idempotent on retries.
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->getContent();

        if (! $this->paystack->isValidSignature($payload, $request->header('x-paystack-signature'))) {
            return response()->json(['message' => 'Invalid signature.'], 401);
        }

        $event = $request->json('event');
        $reference = $request->json('data.reference');

        if ($event === 'charge.success' && is_string($reference)) {
            $order = Order::where('payment_reference', $reference)->first();

            if ($order !== null) {
                $this->orders->markPaid($order, $reference);
            }
        }

        return response()->json(['message' => 'ok']);
    }
}
