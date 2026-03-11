<?php

namespace App\Events;

use App\Models\GroupMessage;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public GroupMessage $message)
    {
        $this->message->loadMissing('sender:id,name,email');
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('group.' . $this->message->group_id)];
    }
}
