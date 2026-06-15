<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Business;
use App\Models\Order;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $reviews) {}

    /**
     * Submit a review for one of the authenticated customer's delivered orders.
     */
    public function store(StoreReviewRequest $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 403);

        $review = $this->reviews->submit(
            $order,
            $request->user(),
            (int) $request->integer('rating'),
            $request->input('text'),
        );

        return (new ReviewResource($review))->response()->setStatusCode(201);
    }

    /**
     * Public list of a kitchen's visible reviews.
     */
    public function index(Business $kitchen): AnonymousResourceCollection
    {
        abort_unless($kitchen->status === 'active', 404);

        $reviews = $kitchen->reviews()
            ->visible()
            ->with('user:id,name')
            ->latest()
            ->paginate(15);

        return ReviewResource::collection($reviews);
    }
}
