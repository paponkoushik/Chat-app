<?php

namespace App\Services\Chat;

use App\Events\MessagesSeen;
use App\Events\MessageSent;
use App\Models\Message;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class ChatService
{
    public function sendMessage(array $data): JsonResponse
    {
        $message = Message::create([
            ...$data,
            'sender_id' => auth()->id()
        ]);

        broadcast(new MessageSent($message))->toOthers();

        return response()->json($message);
    }

    public function getInboxMessages(int $userId, array $data = []): JsonResponse
    {
        $myId = auth()->id();
        $limit = $this->resolveLimit($data);
        $beforeId = $this->resolveBeforeId($data);
        $messages = $this->buildConversationQuery($myId, $userId, $beforeId)
            ->limit($limit + 1)
            ->get();

        return $this->buildInboxResponse($messages, $limit);
    }

    public function markConversationAsSeen(int $userId): JsonResponse
    {
        $viewerId = auth()->id();
        $seenAt = now();
        $messageIds = $this->getUnseenMessageIds($userId, $viewerId);

        if (empty($messageIds)) {
            return $this->buildSeenResponse();
        }

        $this->updateSeenMessages($messageIds, $seenAt);
        $this->broadcastSeenMessages($viewerId, $userId, $messageIds, $seenAt->toISOString());

        return $this->buildSeenResponse($messageIds, $seenAt->toISOString());
    }

    private function resolveLimit(array $data): int
    {
        return min(max((int) ($data['limit'] ?? 20), 1), 50);
    }

    private function resolveBeforeId(array $data): ?int
    {
        return isset($data['before_id']) ? (int) $data['before_id'] : null;
    }

    private function buildConversationQuery(int $myId, int $userId, ?int $beforeId): Builder
    {
        $query = Message::where(function ($query) use ($myId, $userId) {
            $query->where(function ($q) use ($myId, $userId) {
                $q->where('sender_id', $myId)->where('receiver_id', $userId);
            })->orWhere(function ($q) use ($myId, $userId) {
                $q->where('sender_id', $userId)->where('receiver_id', $myId);
            });
        })->orderByDesc('id');

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        return $query;
    }

    private function buildInboxResponse(Collection $messages, int $limit): JsonResponse
    {
        $hasMore = $messages->count() > $limit;

        if ($hasMore) {
            $messages = $messages->take($limit);
        }

        $messages = $messages->reverse()->values();

        return response()->json([
            'data' => $messages,
            'meta' => [
                'has_more' => $hasMore,
                'oldest_message_id' => $messages->first()?->id,
            ],
        ]);
    }

    private function getUnseenMessageIds(int $userId, int $viewerId): array
    {
        return Message::query()
            ->where('sender_id', $userId)
            ->where('receiver_id', $viewerId)
            ->whereNull('seen_at')
            ->pluck('id')
            ->all();
    }

    private function updateSeenMessages(array $messageIds, $seenAt): void
    {
        Message::query()
            ->whereIn('id', $messageIds)
            ->update(['seen_at' => $seenAt]);
    }

    private function broadcastSeenMessages(int $viewerId, int $userId, array $messageIds, string $seenAt): void
    {
        broadcast(new MessagesSeen(
            viewerId: $viewerId,
            chatUserId: $userId,
            messageIds: $messageIds,
            seenAt: $seenAt,
        ))->toOthers();
    }

    private function buildSeenResponse(array $messageIds = [], ?string $seenAt = null): JsonResponse
    {
        return response()->json([
            'message_ids' => $messageIds,
            'seen_at' => $seenAt,
        ]);
    }
}
