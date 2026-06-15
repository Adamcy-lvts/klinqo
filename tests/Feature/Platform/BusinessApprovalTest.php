<?php

namespace Tests\Feature\Platform;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BusinessApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function admin(): User
    {
        return User::factory()->admin()->create();
    }

    public function test_admin_sees_the_pending_queue_by_default(): void
    {
        Business::factory()->pending()->create();
        Business::factory()->create(['status' => 'active']);

        $this->actingAs($this->admin())
            ->get(route('platform.businesses.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('platform/Businesses')
                ->has('businesses.data', 1)
            );
    }

    public function test_admin_can_approve_a_pending_kitchen(): void
    {
        $business = Business::factory()->pending()->create(['onboarded_at' => null]);

        $this->actingAs($this->admin())
            ->post(route('platform.businesses.approve', $business))
            ->assertRedirect();

        $business->refresh();
        $this->assertSame('active', $business->status);
        $this->assertNotNull($business->onboarded_at);
    }

    public function test_admin_can_suspend_and_reactivate(): void
    {
        $business = Business::factory()->create(['status' => 'active']);
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('platform.businesses.suspend', $business));
        $this->assertSame('suspended', $business->fresh()->status);

        $this->actingAs($admin)->post(route('platform.businesses.reactivate', $business));
        $this->assertSame('active', $business->fresh()->status);
    }

    public function test_admin_can_set_per_kitchen_commission(): void
    {
        $business = Business::factory()->create(['commission_percent' => null]);

        $this->actingAs($this->admin())
            ->patch(route('platform.businesses.commission', $business), ['commission_percent' => 12.5])
            ->assertRedirect();

        $this->assertSame('12.50', $business->fresh()->commission_percent);
    }

    public function test_non_admins_cannot_access_the_platform_area(): void
    {
        $business = Business::factory()->pending()->create();

        $this->actingAs(User::factory()->businessOwner()->create())
            ->get(route('platform.businesses.index'))
            ->assertForbidden();

        $this->actingAs(User::factory()->create())
            ->post(route('platform.businesses.approve', $business))
            ->assertForbidden();
    }
}
