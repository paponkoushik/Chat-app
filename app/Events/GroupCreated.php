<?php

namespace App\Events;

use App\Models\Group;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Group $group, public array $memberIds)
    {
    }

    public function broadcastOn(): array
    {
        return collect($this->memberIds)
            ->map(fn (int $memberId) => new PrivateChannel('chat.' . $memberId))
            ->all();
    }
}
