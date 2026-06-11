<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'area' => ['nullable', 'string', 'max:120'],
            'prep_time_min' => ['nullable', 'integer', 'min:0', 'max:600'],
            'prep_time_max' => ['nullable', 'integer', 'min:0', 'max:600'],
            'accepts_online' => ['boolean'],
            'accepts_on_delivery' => ['boolean'],
            'accepts_on_pickup' => ['boolean'],
            'operating_hours' => ['nullable', 'array'],
            'cuisines' => ['array'],
            'cuisines.*' => ['uuid', 'exists:cuisines,id'],
            'logo' => ['nullable', 'image', 'max:4096'],
            'cover' => ['nullable', 'image', 'max:6144'],
        ];
    }
}
