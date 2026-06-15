<?php

namespace Tests\Feature\Admin;

use App\Models\Business;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReviewModerationTest extends TestCase
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

    public function test_reviews_index_is_scoped_to_the_kitchen(): void
    {
        [$owner, $business] = $this->owner();
        Review::factory()->count(2)->create(['business_id' => $business->id]);
        Review::factory()->create();

        $this->actingAs($owner)
            ->get(route('reviews.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/reviews/Index')
                ->has('reviews.data', 2)
            );
    }

    public function test_owner_can_hide_and_unhide_a_review_and_rating_recomputes(): void
    {
        [$owner, $business] = $this->owner();
        Review::factory()->create(['business_id' => $business->id, 'rating' => 5]);
        $review = Review::factory()->create(['business_id' => $business->id, 'rating' => 1]);

        $business->refresh();
        $this->assertSame('3.0', $business->rating);

        // Hide the 1-star review -> average becomes 5.0
        $this->actingAs($owner)
            ->patch(route('reviews.toggle', $review))
            ->assertRedirect();

        $this->assertTrue($review->fresh()->is_hidden);
        $this->assertSame('5.0', $business->fresh()->rating);

        // Unhide -> back to 3.0
        $this->actingAs($owner)->patch(route('reviews.toggle', $review));
        $this->assertFalse($review->fresh()->is_hidden);
        $this->assertSame('3.0', $business->fresh()->rating);
    }

    public function test_owner_cannot_moderate_another_kitchens_review(): void
    {
        [$owner] = $this->owner();
        $foreign = Review::factory()->create();

        $this->actingAs($owner)->patch(route('reviews.toggle', $foreign))->assertForbidden();
    }

    public function test_customer_cannot_reach_review_moderation(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'customer']));

        $this->get(route('reviews.index'))->assertForbidden();
    }
}
