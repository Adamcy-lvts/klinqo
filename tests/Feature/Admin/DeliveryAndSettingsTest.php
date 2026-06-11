<?php

namespace Tests\Feature\Admin;

use App\Models\Business;
use App\Models\Cuisine;
use App\Models\DeliveryMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DeliveryAndSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    /**
     * @return array{0: User, 1: Business}
     */
    private function owner(): array
    {
        $owner = User::factory()->businessOwner()->create();
        $business = Business::factory()->create(['owner_user_id' => $owner->id]);

        return [$owner, $business];
    }

    public function test_owner_can_create_a_delivery_method(): void
    {
        [$owner, $business] = $this->owner();

        $this->actingAs($owner)
            ->post(route('delivery-methods.store'), ['name' => 'Express', 'fee' => 1200])
            ->assertRedirect();

        $this->assertDatabaseHas('delivery_methods', [
            'business_id' => $business->id,
            'name' => 'Express',
            'fee' => 1200,
        ]);
    }

    public function test_owner_cannot_delete_another_kitchens_delivery_method(): void
    {
        [$owner] = $this->owner();
        $foreign = DeliveryMethod::factory()->create();

        $this->actingAs($owner)
            ->delete(route('delivery-methods.destroy', $foreign))
            ->assertForbidden();

        $this->assertDatabaseHas('delivery_methods', ['id' => $foreign->id]);
    }

    public function test_delivery_methods_index_is_scoped_to_owner(): void
    {
        [$owner, $business] = $this->owner();
        DeliveryMethod::factory()->create(['business_id' => $business->id]);
        DeliveryMethod::factory()->create();

        $this->actingAs($owner)
            ->get(route('delivery-methods.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/delivery/Index')
                ->has('deliveryMethods', 1)
            );
    }

    public function test_owner_can_update_business_settings_and_sync_cuisines(): void
    {
        Storage::fake('public');
        [$owner, $business] = $this->owner();
        $cuisine = Cuisine::factory()->create();

        $this->actingAs($owner)
            ->put(route('business.settings.update'), [
                'name' => 'Mira Updated',
                'tagline' => 'Now even better',
                'accepts_online' => true,
                'accepts_on_delivery' => false,
                'accepts_on_pickup' => true,
                'cuisines' => [$cuisine->id],
                'logo' => UploadedFile::fake()->image('logo.png'),
            ])
            ->assertRedirect();

        $business->refresh();
        $this->assertSame('Mira Updated', $business->name);
        $this->assertFalse($business->accepts_on_delivery);
        $this->assertNotNull($business->logo_url);
        $this->assertTrue($business->cuisines()->whereKey($cuisine->id)->exists());
    }

    public function test_settings_page_loads_for_owner(): void
    {
        [$owner] = $this->owner();

        $this->actingAs($owner)
            ->get(route('business.settings.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/BusinessSettings')
                ->has('business')
                ->has('allCuisines')
            );
    }

    public function test_customer_cannot_reach_settings(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']));

        $this->get(route('business.settings.edit'))->assertForbidden();
    }
}
