<?php

namespace Tests\Feature\Onboarding;

use App\Models\Business;
use App\Models\Cuisine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_details_step_creates_a_pending_kitchen_and_promotes_the_user(): void
    {
        $user = User::factory()->create(['role' => 'customer']);

        $this->actingAs($user)
            ->post(route('onboarding.details'), ['name' => 'Ada Kitchen'])
            ->assertRedirect(route('onboarding.index'));

        $this->assertDatabaseHas('businesses', [
            'owner_user_id' => $user->id,
            'name' => 'Ada Kitchen',
            'status' => 'pending',
            'onboarding_step' => 'location',
        ]);
        $this->assertSame('business_owner', $user->fresh()->role);
    }

    public function test_full_onboarding_flow_creates_subaccount_and_submits_for_review(): void
    {
        config(['services.paystack.secret' => 'sk_test']);
        Http::fake([
            'api.paystack.co/subaccount' => Http::response(['data' => ['subaccount_code' => 'ACCT_xyz']], 200),
        ]);

        $user = User::factory()->create();
        $cuisine = Cuisine::factory()->create();

        $this->actingAs($user);
        $this->post(route('onboarding.details'), ['name' => 'Ada Kitchen']);
        $this->post(route('onboarding.location'), ['address' => '14 Allen Ave', 'area' => 'Ikeja']);
        $this->post(route('onboarding.cuisines'), ['cuisines' => [$cuisine->id]]);
        $this->post(route('onboarding.payout'), [
            'bank_name' => 'GTBank',
            'bank_code' => '058',
            'account_number' => '0123456789',
            'account_name' => 'Ada Kitchen Ltd',
        ])->assertRedirect(route('onboarding.index'));

        $business = Business::firstWhere('owner_user_id', $user->id);
        $this->assertSame('submitted', $business->onboarding_step);
        $this->assertSame('pending', $business->status);
        $this->assertSame('ACCT_xyz', $business->paystack_subaccount_code);
        $this->assertTrue($business->cuisines()->whereKey($cuisine->id)->exists());
    }

    public function test_onboarding_redirects_to_dashboard_once_active(): void
    {
        $user = User::factory()->businessOwner()->create();
        Business::factory()->create(['owner_user_id' => $user->id, 'status' => 'active']);

        $this->actingAs($user)->get(route('onboarding.index'))->assertRedirect(route('dashboard'));
    }

    public function test_index_renders_the_wizard_at_the_current_step(): void
    {
        $user = User::factory()->businessOwner()->create();
        Business::factory()->create(['owner_user_id' => $user->id, 'status' => 'pending', 'onboarding_step' => 'cuisines']);

        $this->actingAs($user)
            ->get(route('onboarding.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('onboarding/Wizard')->where('step', 'cuisines'));
    }

    public function test_later_steps_require_a_started_draft(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('onboarding.location'), ['address' => 'x', 'area' => 'y'])
            ->assertStatus(409);
    }
}
