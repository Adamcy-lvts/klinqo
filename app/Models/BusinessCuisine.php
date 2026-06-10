<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * @property string $id
 * @property string $business_id
 * @property string $cuisine_id
 */
class BusinessCuisine extends Pivot
{
    use HasUuids;

    protected $table = 'business_cuisine';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;
}
