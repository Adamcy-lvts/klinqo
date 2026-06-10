<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\CuisineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property string $id
 * @property string $name
 * @property string $slug
 * @property string|null $emoji
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['name', 'slug', 'emoji'])]
class Cuisine extends Model
{
    /** @use HasFactory<CuisineFactory> */
    use HasFactory, HasUuids;

    /**
     * @return BelongsToMany<Business, $this, BusinessCuisine>
     */
    public function businesses(): BelongsToMany
    {
        return $this->belongsToMany(Business::class, 'business_cuisine')
            ->using(BusinessCuisine::class);
    }
}
