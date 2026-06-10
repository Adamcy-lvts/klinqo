<?php

namespace Tests\Feature\Api;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'label' => 'Home',
            'address_line' => '12 Allen Avenue, Ikeja',
            'phone' => '+2348011112222',
        ], $overrides);
    }

    public function test_first_address_becomes_default(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/addresses', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.is_default', true);
    }

    public function test_marking_a_new_address_default_unsets_the_previous_one(): void
    {
        $user = User::factory()->create();
        $first = Address::factory()->default()->create(['user_id' => $user->id]);
        Sanctum::actingAs($user);

        $this->postJson('/api/addresses', $this->payload(['is_default' => true]))->assertCreated();

        $this->assertFalse($first->fresh()->is_default);
        $this->assertSame(1, $user->addresses()->where('is_default', true)->count());
    }

    public function test_user_can_list_their_addresses(): void
    {
        $user = User::factory()->create();
        Address::factory()->count(2)->create(['user_id' => $user->id]);
        Address::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/addresses')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_user_can_update_their_address(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create(['user_id' => $user->id, 'label' => 'Home']);
        Sanctum::actingAs($user);

        $this->putJson("/api/addresses/{$address->id}", ['label' => 'Work'])
            ->assertOk()
            ->assertJsonPath('data.label', 'Work');
    }

    public function test_user_cannot_modify_another_users_address(): void
    {
        $address = Address::factory()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->putJson("/api/addresses/{$address->id}", ['label' => 'Hack'])->assertForbidden();
        $this->deleteJson("/api/addresses/{$address->id}")->assertForbidden();
    }

    public function test_deleting_the_default_promotes_another_address(): void
    {
        $user = User::factory()->create();
        $default = Address::factory()->default()->create(['user_id' => $user->id]);
        $other = Address::factory()->create(['user_id' => $user->id, 'is_default' => false]);
        Sanctum::actingAs($user);

        $this->deleteJson("/api/addresses/{$default->id}")->assertOk();

        $this->assertTrue($other->fresh()->is_default);
    }
}
