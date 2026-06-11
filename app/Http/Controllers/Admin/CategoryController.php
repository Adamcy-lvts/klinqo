<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ResolvesCurrentBusiness;

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $business = $this->requireBusiness($request);

        $business->categories()->create([
            'name' => $request->string('name'),
            'emoji' => $request->input('emoji'),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => (int) $business->categories()->max('sort_order') + 1,
        ]);

        return back();
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $category->business_id);

        $category->update($request->validated());

        return back();
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $category->business_id);

        $category->delete();

        return back();
    }

    public function reorder(Request $request): RedirectResponse
    {
        $business = $this->requireBusiness($request);

        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['uuid'],
        ]);

        foreach ($validated['ids'] as $index => $id) {
            $business->categories()->whereKey($id)->update(['sort_order' => $index]);
        }

        return back();
    }
}
