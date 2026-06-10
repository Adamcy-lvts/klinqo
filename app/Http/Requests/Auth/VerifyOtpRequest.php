<?php

namespace App\Http\Requests\Auth;

use App\Enums\OtpPurpose;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VerifyOtpRequest extends FormRequest
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
            'phone' => ['required', 'string', 'regex:/^\+?[0-9]{7,15}$/'],
            'purpose' => ['required', 'string', Rule::in(OtpPurpose::values())],
            'code' => ['required', 'string'],
        ];
    }

    public function phone(): string
    {
        return (string) $this->string('phone');
    }

    public function purpose(): OtpPurpose
    {
        return OtpPurpose::from((string) $this->string('purpose'));
    }

    public function code(): string
    {
        return (string) $this->string('code');
    }
}
