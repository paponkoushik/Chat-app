<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InboxMessagesRequest;
use App\Http\Requests\SendMessageRequest;
use App\Services\Chat\ChatService;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    public function __construct(protected ChatService $chatService)
    {
    }

    public function send(SendMessageRequest $request): JsonResponse
    {
        return $this->chatService->sendMessage($request->safe()->only(['receiver_id', 'message']));
    }


    public function inbox(InboxMessagesRequest $request, int $userId): JsonResponse
    {
        return $this->chatService->getInboxMessages(
            $userId,
            $request->safe()->only(['limit', 'before_id']),
        );
    }

    public function markSeen(int $userId): JsonResponse
    {
        return $this->chatService->markConversationAsSeen($userId);
    }
}
