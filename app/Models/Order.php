<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property string $id
 * @property string $order_number
 * @property string $business_id
 * @property string $user_id
 * @property string $delivery_type
 * @property string|null $delivery_method_id
 * @property string|null $address_id
 * @property string $payment_method
 * @property string $payment_status
 * @property string|null $payment_reference
 * @property string $status
 * @property string $subtotal
 * @property string $delivery_fee
 * @property string $total
 * @property string $commission_percent
 * @property string $commission_amount
 * @property string|null $note
 * @property CarbonImmutable|null $placed_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable([
    'order_number', 'business_id', 'user_id', 'delivery_type', 'delivery_method_id',
    'address_id', 'payment_method', 'payment_status', 'payment_reference', 'status',
    'subtotal', 'delivery_fee', 'total', 'commission_percent', 'commission_amount',
    'note', 'placed_at',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'total' => 'decimal:2',
            'commission_percent' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'placed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order): void {
            if (empty($order->order_number)) {
                $order->order_number = static::generateOrderNumber();
            }

            if (empty($order->placed_at)) {
                $order->placed_at = now();
            }
        });
    }

    /**
     * Generate the next human-readable order reference, e.g. KLQ-0042.
     */
    public static function generateOrderNumber(): string
    {
        $next = static::query()->count() + 1;

        do {
            $candidate = 'KLQ-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
            $next++;
        } while (static::query()->where('order_number', $candidate)->exists());

        return $candidate;
    }

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<DeliveryMethod, $this>
     */
    public function deliveryMethod(): BelongsTo
    {
        return $this->belongsTo(DeliveryMethod::class);
    }

    /**
     * @return BelongsTo<Address, $this>
     */
    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasOne<Review, $this>
     */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}
