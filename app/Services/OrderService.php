<?php

namespace App\Services;

use App\Events\OrderStatusChanged;
use App\Exceptions\InvalidOrderTransitionException;
use App\Models\Address;
use App\Models\Business;
use App\Models\CommissionLedgerEntry;
use App\Models\DeliveryMethod;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    private const CASH_METHODS = ['pay_on_delivery', 'pay_on_pickup'];

    /**
     * Validate a cart, re-price it from the database (never trusting client
     * prices), snapshot commission, and persist the order. Cash orders also
     * accrue a pending commission-ledger entry.
     *
     * @param  array<string, mixed>  $data
     */
    public function place(User $user, array $data): Order
    {
        $kitchen = Business::active()->whereKey($data['business_id'])->first();

        if ($kitchen === null) {
            throw ValidationException::withMessages(['business_id' => ['This kitchen is not available.']]);
        }

        $deliveryType = (string) $data['delivery_type'];
        $paymentMethod = (string) $data['payment_method'];

        $this->assertPaymentMethodAllowed($kitchen, $deliveryType, $paymentMethod);

        [$deliveryMethodId, $deliveryFee, $addressId] = $this->resolveDelivery($user, $kitchen, $deliveryType, $data);

        $lines = $this->priceItems($kitchen, $data['items']);
        $subtotal = array_sum(array_column($lines, 'total_price'));
        $deliveryFee = $deliveryType === 'delivery' ? $deliveryFee : 0.0;
        $total = $subtotal + $deliveryFee;

        $commissionPercent = $kitchen->effectiveCommissionPercent();
        $commissionAmount = round($subtotal * $commissionPercent / 100, 2);

        return DB::transaction(function () use (
            $user, $kitchen, $deliveryType, $paymentMethod, $deliveryMethodId, $addressId,
            $lines, $subtotal, $deliveryFee, $total, $commissionPercent, $commissionAmount, $data
        ) {
            $order = Order::create([
                'business_id' => $kitchen->id,
                'user_id' => $user->id,
                'delivery_type' => $deliveryType,
                'delivery_method_id' => $deliveryMethodId,
                'address_id' => $addressId,
                'payment_method' => $paymentMethod,
                'payment_status' => 'pending',
                'status' => Order::STATUS_PLACED,
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'commission_percent' => $commissionPercent,
                'commission_amount' => $commissionAmount,
                'note' => $data['note'] ?? null,
            ]);

            $order->items()->createMany($lines);

            if (in_array($paymentMethod, self::CASH_METHODS, true)) {
                CommissionLedgerEntry::create([
                    'business_id' => $kitchen->id,
                    'order_id' => $order->id,
                    'type' => 'accrual',
                    'amount' => $commissionAmount,
                    'status' => 'pending',
                    'note' => 'Commission accrued on cash order',
                ]);
            }

            return $order->load('items');
        });
    }

    /**
     * Advance an order through the status machine, broadcasting the change.
     *
     * @throws InvalidOrderTransitionException
     */
    public function transition(Order $order, string $status): Order
    {
        if (! $order->canTransitionTo($status)) {
            throw new InvalidOrderTransitionException($order->status, $status);
        }

        $from = $order->status;
        $order->update(['status' => $status]);

        if ($status === Order::STATUS_CANCELLED) {
            $order->commissionLedgerEntries()
                ->where('status', 'pending')
                ->update(['status' => 'void', 'note' => 'Voided on cancellation']);
        }

        event(new OrderStatusChanged($order, $from));

        return $order;
    }

    /**
     * Mark an order paid and move it to confirmed. Idempotent on retries.
     */
    public function markPaid(Order $order, string $reference): Order
    {
        if ($order->payment_status === 'paid') {
            return $order;
        }

        $order->update(['payment_status' => 'paid', 'payment_reference' => $reference]);

        if ($order->canTransitionTo(Order::STATUS_CONFIRMED)) {
            $this->transition($order, Order::STATUS_CONFIRMED);
        }

        return $order;
    }

    private function assertPaymentMethodAllowed(Business $kitchen, string $deliveryType, string $paymentMethod): void
    {
        $allowed = match ($paymentMethod) {
            'online' => $kitchen->accepts_online,
            'pay_on_delivery' => $kitchen->accepts_on_delivery && $deliveryType === 'delivery',
            'pay_on_pickup' => $kitchen->accepts_on_pickup && $deliveryType === 'pickup',
            default => false,
        };

        if (! $allowed) {
            throw ValidationException::withMessages([
                'payment_method' => ['This payment method is not available for the selected option.'],
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{0: ?string, 1: float, 2: ?string}
     */
    private function resolveDelivery(User $user, Business $kitchen, string $deliveryType, array $data): array
    {
        if ($deliveryType !== 'delivery') {
            // Pickup: no address; an optional pickup method may carry a fee.
            $method = $this->deliveryMethod($kitchen, $data['delivery_method_id'] ?? null);
            $fee = $method !== null ? (float) $method->fee : 0.0;

            return [$method?->id, $fee, null];
        }

        $addressId = $data['address_id'] ?? null;
        $address = $addressId !== null
            ? Address::where('user_id', $user->id)->whereKey($addressId)->first()
            : null;
        if ($address === null) {
            throw ValidationException::withMessages(['address_id' => ['A valid delivery address is required.']]);
        }

        $method = $this->deliveryMethod($kitchen, $data['delivery_method_id'] ?? null);
        if ($method === null) {
            throw ValidationException::withMessages(['delivery_method_id' => ['A valid delivery method is required.']]);
        }

        return [$method->id, (float) $method->fee, $address->id];
    }

    private function deliveryMethod(Business $kitchen, ?string $id): ?DeliveryMethod
    {
        if ($id === null) {
            return null;
        }

        return DeliveryMethod::where('business_id', $kitchen->id)->active()->whereKey($id)->first();
    }

    /**
     * Re-price each cart line from the kitchen's available menu.
     *
     * @param  array<int, array<string, mixed>>  $items
     * @return list<array{menu_item_id: string, name: string, unit_price: float, quantity: int, total_price: float, note: ?string}>
     */
    private function priceItems(Business $kitchen, array $items): array
    {
        $ids = array_values(array_unique(array_map(fn ($i) => (string) $i['menu_item_id'], $items)));

        $menuItems = MenuItem::query()
            ->available()
            ->where('business_id', $kitchen->id)
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        $lines = [];

        foreach ($items as $item) {
            $menuItem = $menuItems->get($item['menu_item_id']);

            if ($menuItem === null) {
                throw ValidationException::withMessages([
                    'items' => ['One or more items are unavailable for this kitchen.'],
                ]);
            }

            $quantity = (int) $item['quantity'];
            $unitPrice = (float) $menuItem->price;

            $lines[] = [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'unit_price' => $unitPrice,
                'quantity' => $quantity,
                'total_price' => round($unitPrice * $quantity, 2),
                'note' => $item['note'] ?? null,
            ];
        }

        return $lines;
    }
}
