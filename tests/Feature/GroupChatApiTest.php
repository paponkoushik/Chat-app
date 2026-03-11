<?php

namespace Tests\Feature;

use App\Events\GroupCreated;
use App\Events\GroupMessageSent;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GroupChatApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_authenticated_user_can_create_a_group(): void
    {
        Event::fake([GroupCreated::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        Sanctum::actingAs($owner);

        $response = $this->postJson('/api/groups', [
            'name' => 'Project Team',
            'member_ids' => [$member->id],
        ]);

        $response
            ->assertCreated()
            ->assertJsonFragment([
                'name' => 'Project Team',
                'owner_id' => $owner->id,
                'members_count' => 2,
            ]);

        $group = Group::first();

        $this->assertNotNull($group);
        $this->assertTrue($group->members->contains('id', $owner->id));
        $this->assertTrue($group->members->contains('id', $member->id));
        Event::assertDispatched(GroupCreated::class);
    }

    public function test_group_list_only_returns_groups_for_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        $visibleGroup = Group::create([
            'name' => 'Visible Group',
            'owner_id' => $user->id,
        ]);
        $visibleGroup->members()->sync([$user->id, $member->id]);

        $hiddenGroup = Group::create([
            'name' => 'Hidden Group',
            'owner_id' => $outsider->id,
        ]);
        $hiddenGroup->members()->sync([$outsider->id]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/groups');

        $response->assertOk();
        $groupNames = collect($response->json())->pluck('name');

        $this->assertTrue($groupNames->contains('Visible Group'));
        $this->assertFalse($groupNames->contains('Hidden Group'));
    }

    public function test_group_list_includes_unread_count_and_mark_read_resets_it(): void
    {
        $user = User::factory()->create();
        $sender = User::factory()->create();

        $group = Group::create([
            'name' => 'Unread Group',
            'owner_id' => $sender->id,
        ]);
        $group->members()->sync([
            $user->id => ['last_read_at' => now()->subHour()],
            $sender->id => ['last_read_at' => now()],
        ]);

        GroupMessage::create([
            'group_id' => $group->id,
            'sender_id' => $sender->id,
            'message' => 'Unread one',
        ]);

        Sanctum::actingAs($user);

        $listResponse = $this->getJson('/api/groups');

        $this->assertSame(1, collect($listResponse->json())->firstWhere('id', $group->id)['unread_count']);

        $this->postJson('/api/groups/' . $group->id . '/read')->assertOk();

        $listAfterRead = $this->getJson('/api/groups');

        $this->assertSame(0, collect($listAfterRead->json())->firstWhere('id', $group->id)['unread_count']);
    }

    public function test_a_group_member_can_send_and_load_group_messages(): void
    {
        Event::fake([GroupMessageSent::class]);

        $sender = User::factory()->create();
        $member = User::factory()->create();

        $group = Group::create([
            'name' => 'Builders',
            'owner_id' => $sender->id,
        ]);
        $group->members()->sync([$sender->id, $member->id]);

        Sanctum::actingAs($sender);

        $sendResponse = $this->postJson('/api/groups/' . $group->id . '/messages', [
            'message' => 'Hello group',
        ]);

        $sendResponse
            ->assertOk()
            ->assertJsonFragment([
                'group_id' => $group->id,
                'sender_id' => $sender->id,
                'message' => 'Hello group',
            ]);

        $this->assertDatabaseHas('group_messages', [
            'group_id' => $group->id,
            'sender_id' => $sender->id,
            'message' => 'Hello group',
        ]);

        Event::assertDispatched(GroupMessageSent::class);

        Sanctum::actingAs($member);

        $messagesResponse = $this->getJson('/api/groups/' . $group->id . '/messages');

        $messagesResponse
            ->assertOk()
            ->assertJsonPath('data.0.message', 'Hello group')
            ->assertJsonPath('data.0.sender.id', $sender->id);
    }

    public function test_non_members_cannot_access_group_messages(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        $group = Group::create([
            'name' => 'Private Group',
            'owner_id' => $owner->id,
        ]);
        $group->members()->sync([$owner->id, $member->id]);

        GroupMessage::create([
            'group_id' => $group->id,
            'sender_id' => $owner->id,
            'message' => 'Restricted',
        ]);

        Sanctum::actingAs($outsider);

        $this->getJson('/api/groups/' . $group->id . '/messages')->assertNotFound();
        $this->postJson('/api/groups/' . $group->id . '/messages', [
            'message' => 'Nope',
        ])->assertNotFound();
    }

    public function test_group_endpoints_require_authentication(): void
    {
        $group = Group::create([
            'name' => 'Public Name Only',
            'owner_id' => User::factory()->create()->id,
        ]);

        $this->getJson('/api/groups')->assertUnauthorized();
        $this->postJson('/api/groups', [
            'name' => 'Guests',
            'member_ids' => [1],
        ])->assertUnauthorized();
        $this->getJson('/api/groups/' . $group->id . '/messages')->assertUnauthorized();
        $this->postJson('/api/groups/' . $group->id . '/messages', [
            'message' => 'Blocked',
        ])->assertUnauthorized();
    }
}
