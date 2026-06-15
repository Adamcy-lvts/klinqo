<?php

namespace Tests\Feature\Api;

use App\Models\Business;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_review_a_delivered_order_and_rating_recomputes(): void
    {
        $kitchen = Business::factory()->create(['rating' => 0, 'review_count' => 0]);
        $user = User::factory()->create();
        $order = Order::factory()->delivered()->create(['business_id' => $kitchen->id, 'user_id' => $user->id]);
        Sanctum::actingAs($user);

        $this->postJson("/api/orders/{$order->id}/review", ['rating' => 4, 'text' => 'Tasty!'])
            ->assertCreated()
            ->assertJsonPath('data.rating', 4);

        $this->assertDatabaseHas('reviews', ['order_id' => $order->id, 'rating' => 4]);

        $kitchen->refresh();
        $this->assertSame('4.0', $kitchen->rating);
        $this->assertSame(1, $kitchen->review_count);
    }

    public function test_rating_is_the_average_of_visible_reviews(): void
    {
        $kitchen = Business::factory()->create();
        Review::factory()->create(['business_id' => $kitchen->id, 'rating' => 5]);
        Review::factory()->create(['business_id' => $kitchen->id, 'rating' => 2]);

        $kitchen->refresh();
        $this->assertSame('3.5', $kitchen->rating);
        $this->assertSame(2, $kitchen->review_count);
    }

    public function test_hidden_reviews_are_excluded_from_the_rating(): void
    {
        $kitchen = Business::factory()->create();
        Review::factory()->create(['business_id' => $kitchen->id, 'rating' => 5]);
        $hidden = Review::factory()->create(['business_id' => $kitchen->id, 'rating' => 1]);

        $hidden->update(['is_hidden' => true]);

        $kitchen->refresh();
        $this->assertSame('5.0', $kitchen->rating);
        $this->assertSame(1, $kitchen->review_count);
    }

    public function test_cannot_review_an_order_that_is_not_delivered(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id, 'status' => 'preparing']);
        Sanctum::actingAs($user);

        $this->postJson("/api/orders/{$order->id}/review", ['rating' => 5])
            ->assertStatus(422)
            ->assertJsonValidationErrors('order');

        $this->assertDatabaseMissing('reviews', ['order_id' => $order->id]);
    }

    public function test_an_order_can_only_be_reviewed_once(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->delivered()->create(['user_id' => $user->id]);
        Review::factory()->create(['order_id' => $order->id, 'business_id' => $order->business_id, 'user_id' => $user->id]);
        Sanctum::actingAs($user);

        $this->postJson("/api/orders/{$order->id}/review", ['rating' => 5])
            ->assertStatus(422)
            ->assertJsonValidationErrors('order');
    }

    public function test_cannot_review_another_users_order(): void
    {
        $order = Order::factory()->delivered()->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/orders/{$order->id}/review", ['rating' => 5])->assertForbidden();
    }

    public function test_kitchen_reviews_are_listed_publicly_and_hide_hidden_ones(): void
    {
        $kitchen = Business::factory()->create();
        Review::factory()->count(2)->create(['business_id' => $kitchen->id]);
        Review::factory()->create(['business_id' => $kitchen->id, 'is_hidden' => true]);

        $this->getJson("/api/kitchens/{$kitchen->id}/reviews")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
