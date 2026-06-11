<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict the web kitchen console to business owners and platform admins.
 */
class EnsureKitchenOperator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user !== null && ($user->isBusinessOwner() || $user->isAdmin()), 403);

        return $next($request);
    }
}
