<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateGroupRequest;
use App\Http\Requests\InboxMessagesRequest;
use App\Http\Requests\SendGroupMessageRequest;
use App\Services\Group\GroupChatService;
use Illuminate\Http\JsonResponse;

class GroupController extends Controller
{
    public function __construct(protected GroupChatService $groupChatService)
    {
    }

    public function index(): JsonResponse
    {
        return $this->groupChatService->listGroups();
    }

    public function store(CreateGroupRequest $request): JsonResponse
    {
        return $this->groupChatService->createGroup(
            $request->safe()->only(['name', 'member_ids'])
        );
    }

    public function messages(InboxMessagesRequest $request, int $groupId): JsonResponse
    {
        return $this->groupChatService->getMessages(
            $groupId,
            $request->safe()->only(['limit', 'before_id']),
        );
    }

    public function sendMessage(SendGroupMessageRequest $request, int $groupId): JsonResponse
    {
        return $this->groupChatService->sendMessage(
            $groupId,
            $request->safe()->only(['message']),
        );
    }

    public function markRead(int $groupId): JsonResponse
    {
        return $this->groupChatService->markGroupAsRead($groupId);
    }
}
