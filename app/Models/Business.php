<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\BusinessFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $id
 * @property string $owner_user_id
 * @property string $name
 * @property string $slug
 * @property string $business_code
 * @property string|null $tagline
 * @property string|null $description
 * @property string|null $logo_url
 * @property string|null $cover_image_url
 * @property string|null $phone
 * @property string|null $email
 * @property string|null $address
 * @property string|null $area
 * @property string|null $latitude
 * @property string|null $longitude
 * @property int|null $prep_time_min
 * @property int|null $prep_time_max
 * @property string $rating
 * @property int $review_count
 * @property string $status
 * @property string|null $commission_percent
 * @property array<string, mixed>|null $operating_hours
 * @property bool $accepts_online
 * @property bool $accepts_on_delivery
 * @property bool $accepts_on_pickup
 * @property string|null $bank_name
 * @property string|null $bank_account_number
 * @property string|null $bank_account_name
 * @property string|null $paystack_subaccount_code
 * @property string|null $onboarding_step
 * @property CarbonImmutable|null $onboarded_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable([
    'owner_user_id', 'name', 'slug', 'business_code', 'tagline', 'description',
    'logo_url', 'cover_image_url', 'phone', 'email', 'address', 'area',
    'latitude', 'longitude', 'prep_time_min', 'prep_time_max', 'rating',
    'review_count', 'status', 'commission_percent', 'operating_hours',
    'accepts_online', 'accepts_on_delivery', 'accepts_on_pickup',
    'bank_name', 'bank_account_number', 'bank_account_name',
    'paystack_subaccount_code', 'onboarding_step', 'onboarded_at',
])]
class Business extends Model
{
    /** @use HasFactory<BusinessFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'rating' => 'decimal:1',
            'review_count' => 'integer',
            'commission_percent' => 'decimal:2',
            'operating_hours' => 'array',
            'accepts_online' => 'boolean',
            'accepts_on_delivery' => 'boolean',
            'accepts_on_pickup' => 'boolean',
            'onboarded_at' => 'datetime',
        ];
    }

    /**
     * Only kitchens that are open for business.
     *
     * @param  Builder<Business>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'active');
    }

    /**
     * The commission rate that applies to this kitchen, falling back to the
     * platform default when no per-kitchen override is set.
     */
    public function effectiveCommissionPercent(): float
    {
        if ($this->commission_percent !== null) {
            return (float) $this->commission_percent;
        }

        return (float) PlatformSetting::current()->default_commission_percent;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    /**
     * @return BelongsToMany<Cuisine, $this, BusinessCuisine>
     */
    public function cuisines(): BelongsToMany
    {
        return $this->belongsToMany(Cuisine::class, 'business_cuisine')
            ->using(BusinessCuisine::class);
    }

    /**
     * Customers who have joined this kitchen.
     *
     * @return BelongsToMany<User, $this, BusinessUser>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'business_user')
            ->using(BusinessUser::class)
            ->withPivot('joined_at');
    }

    /**
     * @return HasMany<Category, $this>
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * @return HasMany<MenuItem, $this>
     */
    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }

    /**
     * @return HasMany<DeliveryMethod, $this>
     */
    public function deliveryMethods(): HasMany
    {
        return $this->hasMany(DeliveryMethod::class);
    }

    /**
     * @return HasMany<Promotion, $this>
     */
    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * @return HasMany<Review, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
