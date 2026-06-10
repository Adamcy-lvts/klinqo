<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiters();
    }

    /**
     * Rate limiters for the phone + OTP auth endpoints.
     */
    protected function configureRateLimiters(): void
    {
        // OTP requests: keyed by phone (falling back to IP) to curb SMS abuse.
        RateLimiter::for('otp', function (Request $request) {
            $key = (string) ($request->input('phone') ?? $request->ip());

            return [
                Limit::perMinute(3)->by('otp:'.$key),
                Limit::perDay(15)->by('otp-daily:'.$key),
            ];
        });

        // Login + reset attempts: keyed by phone + IP.
        RateLimiter::for('auth', function (Request $request) {
            $key = (string) ($request->input('phone') ?? '').'|'.$request->ip();

            return Limit::perMinute(5)->by('auth:'.$key);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
