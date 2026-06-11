<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ResolvesCurrentBusiness;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDeliveryMethodRequest;
use App\Http\Requests\Admin\UpdateDeliveryMethodRequest;
use App\Models\DeliveryMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryMethodController extends Controller
{
    use ResolvesCurrentBusiness;

    public function index(Request $request): Response
    {
        $business = $this->requireBusiness($request);

        return Inertia::render('admin/delivery/Index', [
            'deliveryMethods' => $business->deliveryMethods()->orderBy('sort_order')->get(),
        ]);
    }

    public function store(StoreDeliveryMethodRequest $request): RedirectResponse
    {
        $business = $this->requireBusiness($request);

        $business->deliveryMethods()->create([
            'name' => $request->string('name'),
            'description' => $request->input('description'),
            'fee' => $request->float('fee'),
            'is_active' => $request->boolean('is_active', true),
            'sort_order' => (int) $business->deliveryMethods()->max('sort_order') + 1,
        ]);

        return back();
    }

    public function update(UpdateDeliveryMethodRequest $request, DeliveryMethod $deliveryMethod): RedirectResponse
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $deliveryMethod->business_id);

        $deliveryMethod->update($request->validated());

        return back();
    }

    public function destroy(Request $request, DeliveryMethod $deliveryMethod): RedirectResponse
    {
        $this->assertBelongsToBusiness($this->requireBusiness($request), $deliveryMethod->business_id);

        $deliveryMethod->delete();

        return back();
    }
}
