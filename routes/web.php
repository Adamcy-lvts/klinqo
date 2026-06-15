<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'Welcome')->name('home');

require __DIR__.'/storefront.php';
require __DIR__.'/onboarding.php';
require __DIR__.'/admin.php';
require __DIR__.'/platform.php';
require __DIR__.'/settings.php';
