<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\PlatformSettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $default_commission_percent
 * @property string|null $support_phone
 * @property string|null $support_email
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['default_commission_percent', 'support_phone', 'support_email'])]
class PlatformSetting extends Model
{
    /** @use HasFactory<PlatformSettingFactory> */
    use HasFactory, HasUuids;

    protected function casts(): array
    {
        return [
            'default_commission_percent' => 'decimal:2',
        ];
    }

    /**
     * The single platform settings row.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }
}
