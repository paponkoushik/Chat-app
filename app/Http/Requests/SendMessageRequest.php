<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'receiver_id' => [
                'required',
                'exists:users,id',
                Rule::notIn([$this->user()?->id]),
            ],
            'message' => 'required|string',
        ];
    }
}
