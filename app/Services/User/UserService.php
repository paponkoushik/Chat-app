<?php

namespace App\Services\User;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserService
{
    public function searchUsers($request): JsonResponse
    {
        $query = $request->input('query');

        $results = User::query()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                    ->orWhere('email', 'like', '%' . $query . '%');
            })
            ->where('id', '!=', auth()->id())
            ->select('id', 'name', 'email')
            ->selectSub(
                Message::query()
                    ->selectRaw('count(*)')
                    ->whereColumn('sender_id', 'users.id')
                    ->where('receiver_id', auth()->id())
                    ->whereNull('seen_at'),
                'unread_count'
            )
            ->get();

        return response()->json($results);
    }
}
