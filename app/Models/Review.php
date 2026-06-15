<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\ReviewFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $order_id
 * @property string $business_id
 * @property string $user_id
 * @property int $rating
 * @property string|null $text
 * @property bool $is_hidden
 * @property CarbonImmutable|null $reported_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['order_id', 'business_id', 'user_id', 'rating', 'text', 'is_hidden', 'reported_at'])]
class Review extends Model
{
    /** @use HasFactory<ReviewFactory> */
    use HasFactory, HasUuids;

    protected static function booted(): void
    {
        static::saved(fn (Review $review) => $review->recomputeBusinessRating());
        static::deleted(fn (Review $review) => $review->recomputeBusinessRating());
    }

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_hidden' => 'boolean',
            'reported_at' => 'datetime',
        ];
    }

    /**
     * Only public (non-hidden) reviews.
     *
     * @param  Builder<Review>  $query
     */
    public function scopeVisible(Builder $query): void
    {
        $query->where('is_hidden', false);
    }

    /**
     * Recompute and cache the kitchen's denormalized rating + review_count
     * from its visible reviews.
     */
    public function recomputeBusinessRating(): void
    {
        $visible = static::query()
            ->where('business_id', $this->business_id)
            ->where('is_hidden', false);

        $count = (clone $visible)->count();
        $average = $count > 0 ? round((float) (clone $visible)->avg('rating'), 1) : 0;

        Business::query()->whereKey($this->business_id)->update([
            'review_count' => $count,
            'rating' => $average,
        ]);
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
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
}
