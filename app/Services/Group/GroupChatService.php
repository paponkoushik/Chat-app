<?php

namespace App\Services\Group;

use App\Events\GroupCreated;
use App\Events\GroupMessageSent;
use App\Models\Group;
use App\Models\GroupMessage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class GroupChatService
{
    public function listGroups(): JsonResponse
    {
        $user = auth()->user();

        $groups = $user->groups()
            ->withCount('members')
            ->select('groups.id', 'groups.name', 'groups.owner_id')
            ->selectSub(function ($query) use ($user) {
                $query->from('group_messages')
                    ->selectRaw('count(*)')
                    ->whereColumn('group_messages.group_id', 'groups.id')
                    ->where('group_messages.sender_id', '!=', $user->id)
                    ->where(function ($nested) {
                        $nested->whereNull('group_user.last_read_at')
                            ->orWhereColumn('group_messages.created_at', '>', 'group_user.last_read_at');
                    });
            }, 'unread_count')
            ->orderBy('name')
            ->get();

        return response()->json($groups);
    }

    public function createGroup(array $data): JsonResponse
    {
        $ownerId = auth()->id();
        $memberIds = collect($data['member_ids'] ?? [])
            ->push($ownerId)
            ->unique()
            ->values()
            ->all();

        $group = Group::create([
            'name' => $data['name'],
            'owner_id' => $ownerId,
        ]);

        $group->members()->sync(
            collect($memberIds)->mapWithKeys(fn ($memberId) => [
                $memberId => ['last_read_at' => now()],
            ])->all()
        );

        $group->loadCount('members');
        broadcast(new GroupCreated($group, $memberIds));

        return response()->json(
            [
                ...$group->only(['id', 'name', 'owner_id', 'members_count']),
                'unread_count' => 0,
            ],
            201
        );
    }

    public function getMessages(int $groupId, array $data = []): JsonResponse
    {
        $group = $this->findAccessibleGroup($groupId);
        $limit = min(max((int) ($data['limit'] ?? 20), 1), 50);
        $beforeId = isset($data['before_id']) ? (int) $data['before_id'] : null;

        $messages = $this->buildGroupMessagesQuery($group->id, $beforeId)
            ->limit($limit + 1)
            ->get();

        return $this->buildMessagesResponse($messages, $limit);
    }

    public function sendMessage(int $groupId, array $data): JsonResponse
    {
        $group = $this->findAccessibleGroup($groupId);

        $message = GroupMessage::create([
            'group_id' => $group->id,
            'sender_id' => auth()->id(),
            'message' => $data['message'],
        ]);

        $message->load('sender:id,name,email');

        broadcast(new GroupMessageSent($message))->toOthers();

        return response()->json($message);
    }

    public function markGroupAsRead(int $groupId): JsonResponse
    {
        $group = $this->findAccessibleGroup($groupId);

        $group->members()->updateExistingPivot(auth()->id(), [
            'last_read_at' => now(),
        ]);

        return response()->json([
            'group_id' => $group->id,
        ]);
    }

    private function findAccessibleGroup(int $groupId): Group
    {
        return Group::query()
            ->whereKey($groupId)
            ->whereHas('members', function (Builder $query) {
                $query->where('users.id', auth()->id());
            })
            ->firstOrFail();
    }

    private function buildGroupMessagesQuery(int $groupId, ?int $beforeId): Builder
    {
        $query = GroupMessage::query()
            ->where('group_id', $groupId)
            ->with('sender:id,name,email')
            ->orderByDesc('id');

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        return $query;
    }

    private function buildMessagesResponse(Collection $messages, int $limit): JsonResponse
    {
        $hasMore = $messages->count() > $limit;

        if ($hasMore) {
            $messages = $messages->take($limit);
        }

        return response()->json([
            'data' => $messages->reverse()->values(),
            'meta' => [
                'has_more' => $hasMore,
                'oldest_message_id' => $messages->first()?->id,
            ],
        ]);
    }
}
