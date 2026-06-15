<?php

namespace App\Http\Controllers\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Services\OrderService;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class StorefrontCheckoutController extends Controller
{
    public function __construct(
        private readonly OrderService $orders,
        private readonly PaystackService $paystack,
    ) {}

    public function show(Request $request, string $code): Response
    {
        $kitchen = $this->kitchen($code);

        return Inertia::render('storefront/Checkout', [
            'kitchen' => [
                'id' => $kitchen->id,
                'name' => $kitchen->name,
                'business_code' => $kitchen->business_code,
                'accepts_online' => $kitchen->accepts_online,
                'accepts_on_delivery' => $kitchen->accepts_on_delivery,
                'accepts_on_pickup' => $kitchen->accepts_on_pickup,
                'delivery_methods' => $kitchen->deliveryMethods()->active()->orderBy('sort_order')->get(['id', 'name', 'description', 'fee']),
            ],
            'addresses' => $request->user()?->addresses()->orderByDesc('is_default')->get(['id', 'label', 'address_line', 'phone']) ?? [],
        ]);
    }

    public function store(Request $request, string $code): HttpResponse
    {
        $kitchen = $this->kitchen($code);

        $validated = $request->validate([
            'delivery_type' => ['required', 'in:delivery,pickup'],
            'payment_method' => ['required', 'in:online,pay_on_delivery,pay_on_pickup'],
            'delivery_method_id' => ['nullable', 'uuid'],
            'note' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required', 'uuid', 'exists:menu_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'address_id' => ['nullable', 'uuid'],
            'address_line' => ['required_if:delivery_type,delivery', 'nullable', 'string', 'max:500'],
            'address_phone' => ['required_if:delivery_type,delivery', 'nullable', 'string', 'max:20'],
            'address_label' => ['nullable', 'string', 'max:50'],
            'landmark' => ['nullable', 'string', 'max:255'],
        ]);

        $addressId = $this->resolveAddress($request, $validated);

        $order = $this->orders->place($request->user(), [
            'business_id' => $kitchen->id,
            'delivery_type' => $validated['delivery_type'],
            'payment_method' => $validated['payment_method'],
            'delivery_method_id' => $validated['delivery_method_id'] ?? null,
            'address_id' => $addressId,
            'items' => $validated['items'],
            'note' => $validated['note'] ?? null,
        ]);

        if ($order->payment_method === 'online') {
            $result = $this->paystack->initialize(
                $order->load('user', 'business'),
                route('storefront.payment.callback'),
            );
            $order->update(['payment_reference' => $result['reference']]);

            if (! empty($result['authorization_url'])) {
                return Inertia::location($result['authorization_url']);
            }
        }

        return redirect()->route('storefront.order.track', ['code' => $kitchen->business_code, 'order' => $order->id]);
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function resolveAddress(Request $request, array $validated): ?string
    {
        if ($validated['delivery_type'] !== 'delivery') {
            return null;
        }

        if (! empty($validated['address_id'])) {
            return (string) $validated['address_id'];
        }

        $address = $request->user()->addresses()->create([
            'label' => $validated['address_label'] ?? 'Delivery',
            'address_line' => $validated['address_line'],
            'landmark' => $validated['landmark'] ?? null,
            'phone' => $validated['address_phone'],
        ]);

        return $address->id;
    }

    private function kitchen(string $code): Business
    {
        return Business::active()->where('business_code', strtoupper($code))->firstOrFail();
    }
}
