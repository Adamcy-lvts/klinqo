<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateBusinessSettingsRequest;
use App\Models\Cuisine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BusinessSettingsController extends Controller
{
    use ResolvesCurrentBusiness;

    public function edit(Request $request): Response
    {
        $business = $this->requireBusiness($request);
        $business->load('cuisines:id');

        return Inertia::render('admin/BusinessSettings', [
            'business' => $business,
            'allCuisines' => Cuisine::query()->orderBy('name')->get(['id', 'name', 'emoji']),
            'selectedCuisines' => $business->cuisines->pluck('id'),
        ]);
    }

    public function update(UpdateBusinessSettingsRequest $request): RedirectResponse
    {
        $business = $this->requireBusiness($request);

        $business->update([
            'name' => $request->string('name'),
            'tagline' => $request->input('tagline'),
            'description' => $request->input('description'),
            'phone' => $request->input('phone'),
            'email' => $request->input('email'),
            'address' => $request->input('address'),
            'area' => $request->input('area'),
            'prep_time_min' => $request->input('prep_time_min'),
            'prep_time_max' => $request->input('prep_time_max'),
            'accepts_online' => $request->boolean('accepts_online'),
            'accepts_on_delivery' => $request->boolean('accepts_on_delivery'),
            'accepts_on_pickup' => $request->boolean('accepts_on_pickup'),
            'operating_hours' => $request->input('operating_hours'),
            'logo_url' => $this->storeImage($request, 'logo', 'logos') ?? $business->logo_url,
            'cover_image_url' => $this->storeImage($request, 'cover', 'covers') ?? $business->cover_image_url,
        ]);

        $business->cuisines()->sync($request->input('cuisines', []));

        return back();
    }

    private function storeImage(Request $request, string $field, string $folder): ?string
    {
        $file = $request->file($field);

        if (! $file instanceof UploadedFile) {
            return null;
        }

        $path = $file->store($folder, 'public');

        return $path === false ? null : Storage::disk('public')->url($path);
    }
}
