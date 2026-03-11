<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InboxMessagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'limit' => 'nullable|integer|min:1|max:50',
            'before_id' => 'nullable|integer|min:1',
        ];
    }
}
