<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    use ResolvesCurrentBusiness;

    public function index(Request $request): Response
    {
        $business = $this->requireBusiness($request);

        return Inertia::render('admin/reviews/Index', [
            'reviews' => $business->reviews()
                ->with(['user:id,name', 'order:id,order_number'])
                ->latest()
                ->paginate(20),
            'summary' => [
                'rating' => $business->rating,
                'review_count' => $business->review_count,
            ],
        ]);
    }

    /**
     * Hide or unhide a review (hidden reviews drop out of the public rating).
     */
    public function toggleHidden(Request $request, Review $review): RedirectResponse
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $review->business_id);

        $review->update(['is_hidden' => ! $review->is_hidden]);

        return back();
    }
}
