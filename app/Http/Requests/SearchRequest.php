<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SearchRequest extends FormRequest
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
            'q' => ['required', 'string', 'min:1', 'max:100'],
            'kitchen' => ['nullable', 'uuid', 'exists:businesses,id'],
        ];
    }

    public function term(): string
    {
        return mb_strtolower(trim((string) $this->string('q')));
    }
}
