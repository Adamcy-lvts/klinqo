<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMenuItemRequest;
use App\Http\Requests\Admin\UpdateMenuItemRequest;
use App\Models\Business;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MenuItemController extends Controller
{
    use ResolvesCurrentBusiness;

    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        $business = $this->requireBusiness($request);
        $category = $this->categoryForBusiness($business, (string) $request->string('category_id'));

        $business->menuItems()->create([
            'category_id' => $category->id,
            'name' => $request->string('name'),
            'description' => $request->input('description'),
            'price' => $request->float('price'),
            'prep_minutes' => $request->input('prep_minutes'),
            'is_available' => $request->boolean('is_available', true),
            'is_popular' => $request->boolean('is_popular', false),
            'image_url' => $this->storeImage($request),
            'sort_order' => (int) $business->menuItems()->where('category_id', $category->id)->max('sort_order') + 1,
        ]);

        return back();
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): RedirectResponse
    {
        $business = $this->requireBusiness($request);
        $this->assertBelongsToBusiness($business, $menuItem->business_id);

        $data = $request->safe()->except(['image', 'category_id']);

        if ($request->filled('category_id')) {
            $data['category_id'] = $this->categoryForBusiness($business, (string) $request->string('category_id'))->id;
        }

        if ($request->hasFile('image')) {
            $data['image_url'] = $this->storeImage($request);
        }

        $menuItem->update($data);

        return back();
    }

    public function destroy(Request $request, MenuItem $menuItem): RedirectResponse
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $menuItem->business_id);

        $menuItem->delete();

        return back();
    }

    /**
     * Toggle a boolean flag (availability or popular) inline.
     */
    public function toggle(Request $request, MenuItem $menuItem): RedirectResponse
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $menuItem->business_id);

        $validated = $request->validate([
            'field' => ['required', 'in:is_available,is_popular'],
            'value' => ['required', 'boolean'],
        ]);

        $menuItem->update([$validated['field'] => $validated['value']]);

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
            $business->menuItems()->whereKey($id)->update(['sort_order' => $index]);
        }

        return back();
    }

    private function categoryForBusiness(Business $business, string $categoryId): Category
    {
        $category = $business->categories()->whereKey($categoryId)->first();

        if ($category === null) {
            throw ValidationException::withMessages([
                'category_id' => ['Select a category from your kitchen.'],
            ]);
        }

        return $category;
    }

    private function storeImage(Request $request): ?string
    {
        $file = $request->file('image');

        if (! $file instanceof UploadedFile) {
            return null;
        }

        $path = $file->store('menu-items', 'public');

        return $path === false ? null : Storage::disk('public')->url($path);
    }
}
