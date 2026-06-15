<?php

namespace Tests\Feature\Storefront;

use App\Models\Business;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_storefront_shows_visible_reviews(): void
    {
        $kitchen = Business::factory()->create(['business_code' => 'MIRA01']);
        Review::factory()->count(2)->create(['business_id' => $kitchen->id]);
        Review::factory()->create(['business_id' => $kitchen->id, 'is_hidden' => true]);

        $this->get('/s/MIRA01')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('reviews', 2));
    }

    public function test_customer_can_review_a_delivered_order_from_tracking(): void
    {
        $kitchen = Business::factory()->create(['business_code' => 'MIRA01']);
        $user = User::factory()->create();
        $order = Order::factory()->delivered()->create(['business_id' => $kitchen->id, 'user_id' => $user->id]);

        $this->actingAs($user)
            ->post(route('storefront.order.review', ['code' => 'MIRA01', 'order' => $order->id]), [
                'rating' => 5,
                'text' => 'Loved it',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('reviews', ['order_id' => $order->id, 'rating' => 5]);
    }

    public function test_tracking_flags_when_an_order_can_be_reviewed(): void
    {
        $kitchen = Business::factory()->create(['business_code' => 'MIRA01']);
        $user = User::factory()->create();
        $order = Order::factory()->delivered()->create(['business_id' => $kitchen->id, 'user_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('storefront.order.track', ['code' => 'MIRA01', 'order' => $order->id]))
            ->assertInertia(fn (Assert $page) => $page->where('canReview', true));
    }

    public function test_customer_cannot_review_another_users_order(): void
    {
        $kitchen = Business::factory()->create(['business_code' => 'MIRA01']);
        $order = Order::factory()->delivered()->create(['business_id' => $kitchen->id]);

        $this->actingAs(User::factory()->create())
            ->post(route('storefront.order.review', ['code' => 'MIRA01', 'order' => $order->id]), ['rating' => 5])
            ->assertForbidden();
    }
}
