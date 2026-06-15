<?php

namespace Tests\Feature\Storefront;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class StorefrontAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.termii.key' => 'test-key']);
        Http::fake(['*' => Http::response(['message' => 'sent'], 200)]);
        Cache::flush();
    }

    private function requestCode(string $phone): string
    {
        $this->post(route('storefront.auth.otp'), ['phone' => $phone]);

        $code = null;
        Http::assertSent(function ($request) use (&$code) {
            if (preg_match('/code is (\d{6})/', (string) $request['sms'], $m)) {
                $code = $m[1];
            }

            return true;
        });

        $this->assertNotNull($code);

        return (string) $code;
    }

    public function test_verifying_otp_creates_and_logs_in_a_new_customer(): void
    {
        $phone = '+2348095550001';
        $code = $this->requestCode($phone);

        $this->post(route('storefront.auth.verify'), [
            'phone' => $phone,
            'code' => $code,
            'name' => 'Ada',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['phone' => $phone, 'name' => 'Ada', 'role' => 'customer']);
    }

    public function test_verifying_otp_logs_in_an_existing_customer_without_duplicating(): void
    {
        $user = User::factory()->create(['phone' => '+2348095550002', 'password' => Hash::make('x')]);
        $code = $this->requestCode($user->phone);

        $this->post(route('storefront.auth.verify'), ['phone' => $user->phone, 'code' => $code]);

        $this->assertAuthenticatedAs($user->fresh());
        $this->assertSame(1, User::where('phone', $user->phone)->count());
    }

    public function test_wrong_code_does_not_authenticate(): void
    {
        $phone = '+2348095550003';
        $this->requestCode($phone);

        $this->post(route('storefront.auth.verify'), ['phone' => $phone, 'code' => '000000'])
            ->assertSessionHasErrors('code');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['phone' => $phone]);
    }
}
