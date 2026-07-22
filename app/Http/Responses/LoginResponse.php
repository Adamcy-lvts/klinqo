<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

/**
 * Routes users to the right surface after the standard (kitchen) login:
 * platform admins → the Savora console, kitchen owners → the kitchen
 * dashboard, everyone else → home. Platform admins normally use the
 * dedicated /platform/login, but this keeps the standard login correct too.
 */
class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): RedirectResponse|JsonResponse
    {
        $user = $request->user();

        $target = match (true) {
            $user?->isAdmin() => route('platform.console'),
            $user?->isBusinessOwner() => route('dashboard'),
            default => '/',
        };

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false])
            : redirect()->intended($target);
    }
}
