<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * @property string $id
 * @property string $business_id
 * @property string $user_id
 * @property CarbonImmutable|null $joined_at
 */
class BusinessUser extends Pivot
{
    use HasUuids;

    protected $table = 'business_user';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }
}
