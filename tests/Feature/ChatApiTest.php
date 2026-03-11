<?php

namespace Tests\Feature;

use App\Events\MessagesSeen;
use App\Events\MessageSent;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_send_a_message(): void
    {
        Event::fake([MessageSent::class]);

        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        Sanctum::actingAs($sender);

        $response = $this->postJson('/api/messages/send', [
            'receiver_id' => $receiver->id,
            'message' => 'Hello there',
        ]);

        $response
            ->assertOk()
            ->assertJsonFragment([
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'message' => 'Hello there',
            ]);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $sender->id,
            'receiver_id' => $receiver->id,
            'message' => 'Hello there',
        ]);

        Event::assertDispatched(MessageSent::class);
    }

    public function test_opening_a_conversation_marks_incoming_messages_as_seen(): void
    {
        Event::fake([MessagesSeen::class]);

        $viewer = User::factory()->create();
        $chatUser = User::factory()->create();

        $unseenMessage = Message::create([
            'sender_id' => $chatUser->id,
            'receiver_id' => $viewer->id,
            'message' => 'Unread',
        ]);

        $alreadySeenMessage = Message::create([
            'sender_id' => $chatUser->id,
            'receiver_id' => $viewer->id,
            'message' => 'Seen already',
            'seen_at' => now()->subMinute(),
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->postJson('/api/messages/' . $chatUser->id . '/seen');

        $response
            ->assertOk()
            ->assertJsonPath('message_ids.0', $unseenMessage->id);

        $this->assertNotNull($unseenMessage->fresh()->seen_at);
        $this->assertNotNull($alreadySeenMessage->fresh()->seen_at);

        Event::assertDispatched(MessagesSeen::class);
    }

    public function test_a_user_cannot_send_a_message_to_themself(): void
    {
        Event::fake([MessageSent::class]);

        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/messages/send', [
            'receiver_id' => $user->id,
            'message' => 'Loopback',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['receiver_id']);

        $this->assertDatabaseCount('messages', 0);
        Event::assertNotDispatched(MessageSent::class);
    }

    public function test_inbox_returns_paginated_conversation_without_other_threads(): void
    {
        $user = User::factory()->create();
        $chatPartner = User::factory()->create();
        $thirdUser = User::factory()->create();

        Sanctum::actingAs($user);

        $conversation = collect();

        foreach (range(1, 25) as $index) {
            $conversation->push(Message::create([
                'sender_id' => $index % 2 === 0 ? $chatPartner->id : $user->id,
                'receiver_id' => $index % 2 === 0 ? $user->id : $chatPartner->id,
                'message' => "Conversation message {$index}",
            ]));
        }

        Message::create([
            'sender_id' => $thirdUser->id,
            'receiver_id' => $user->id,
            'message' => 'Should not appear',
        ]);

        $latestPage = $this->getJson('/api/messages/' . $chatPartner->id . '?limit=10');
        $latestIds = collect($latestPage->json('data'))->pluck('id');
        $expectedLatestIds = $conversation->pluck('id')->slice(-10)->values();

        $latestPage
            ->assertOk()
            ->assertJsonPath('meta.has_more', true);

        $this->assertSame($expectedLatestIds->all(), $latestIds->all());
        $this->assertNotContains('Should not appear', collect($latestPage->json('data'))->pluck('message')->all());

        $olderPage = $this->getJson('/api/messages/' . $chatPartner->id . '?limit=10&before_id=' . $latestIds->first());
        $olderIds = collect($olderPage->json('data'))->pluck('id');
        $expectedOlderIds = $conversation->pluck('id')->slice(-20, 10)->values();

        $olderPage
            ->assertOk()
            ->assertJsonPath('meta.has_more', true);

        $this->assertSame($expectedOlderIds->all(), $olderIds->all());
    }

    public function test_chat_endpoints_require_authentication(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/messages/send', [
            'receiver_id' => $user->id,
            'message' => 'Blocked',
        ])->assertUnauthorized();

        $this->getJson('/api/messages/' . $user->id)->assertUnauthorized();
        $this->postJson('/api/messages/' . $user->id . '/seen')->assertUnauthorized();
    }

    public function test_users_list_includes_unread_message_counts(): void
    {
        $viewer = User::factory()->create();
        $senderWithUnread = User::factory()->create();
        $senderWithoutUnread = User::factory()->create();

        Message::create([
            'sender_id' => $senderWithUnread->id,
            'receiver_id' => $viewer->id,
            'message' => 'Unread 1',
        ]);

        Message::create([
            'sender_id' => $senderWithUnread->id,
            'receiver_id' => $viewer->id,
            'message' => 'Unread 2',
        ]);

        Message::create([
            'sender_id' => $senderWithoutUnread->id,
            'receiver_id' => $viewer->id,
            'message' => 'Seen',
            'seen_at' => now(),
        ]);

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/users');

        $response->assertOk();
        $this->assertSame(2, collect($response->json())->firstWhere('id', $senderWithUnread->id)['unread_count']);
        $this->assertSame(0, collect($response->json())->firstWhere('id', $senderWithoutUnread->id)['unread_count']);
    }
}
