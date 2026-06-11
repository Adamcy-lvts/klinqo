<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
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
            'category_id' => ['required', 'uuid'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'prep_minutes' => ['nullable', 'integer', 'min:0', 'max:600'],
            'is_available' => ['boolean'],
            'is_popular' => ['boolean'],
            'image' => ['nullable', 'image', 'max:4096'],
        ];
    }
}
