<?php

use App\Http\Controllers\Admin\BusinessSettingsController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DeliveryMethodController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\MenuItemController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ReportController;
use Illuminate\Support\Facades\Route;

/*
| Kitchen console (web, Inertia). Restricted to business owners / admins,
| tenant-scoped to the operator's own kitchen.
*/
Route::middleware(['auth', 'verified', 'kitchen'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Menu management
    Route::get('menu', [MenuController::class, 'index'])->name('menu.index');

    Route::post('menu/categories', [CategoryController::class, 'store'])->name('menu.categories.store');
    Route::put('menu/categories/{category}', [CategoryController::class, 'update'])->name('menu.categories.update');
    Route::delete('menu/categories/{category}', [CategoryController::class, 'destroy'])->name('menu.categories.destroy');
    Route::post('menu/categories/reorder', [CategoryController::class, 'reorder'])->name('menu.categories.reorder');

    Route::post('menu/items', [MenuItemController::class, 'store'])->name('menu.items.store');
    Route::put('menu/items/{menuItem}', [MenuItemController::class, 'update'])->name('menu.items.update');
    Route::delete('menu/items/{menuItem}', [MenuItemController::class, 'destroy'])->name('menu.items.destroy');
    Route::patch('menu/items/{menuItem}/toggle', [MenuItemController::class, 'toggle'])->name('menu.items.toggle');
    Route::post('menu/items/reorder', [MenuItemController::class, 'reorder'])->name('menu.items.reorder');

    // Delivery methods
    Route::get('delivery-methods', [DeliveryMethodController::class, 'index'])->name('delivery-methods.index');
    Route::post('delivery-methods', [DeliveryMethodController::class, 'store'])->name('delivery-methods.store');
    Route::put('delivery-methods/{deliveryMethod}', [DeliveryMethodController::class, 'update'])->name('delivery-methods.update');
    Route::delete('delivery-methods/{deliveryMethod}', [DeliveryMethodController::class, 'destroy'])->name('delivery-methods.destroy');

    // Business settings
    Route::get('business/settings', [BusinessSettingsController::class, 'edit'])->name('business.settings.edit');
    Route::put('business/settings', [BusinessSettingsController::class, 'update'])->name('business.settings.update');

    // Orders
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status.update');

    // Customers
    Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');

    // Reports
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/export', [ReportController::class, 'export'])->name('reports.export');
});
