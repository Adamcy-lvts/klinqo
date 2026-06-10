<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PhoneOtpAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Force the Termii HTTP path so tests can read the generated code,
        // and prevent any real outbound request.
        config(['services.termii.key' => 'test-key']);
        Http::fake(['*' => Http::response(['message' => 'sent'], 200)]);
        Cache::flush();
    }

    /**
     * Request an OTP and return the code captured from the faked SMS payload.
     */
    private function requestOtpCode(string $phone, string $purpose): string
    {
        $this->postJson('/api/auth/request-otp', [
            'phone' => $phone,
            'purpose' => $purpose,
        ])->assertOk()->assertJsonStructure(['message', 'expires_in', 'resend_in']);

        $code = null;
        Http::assertSent(function ($request) use (&$code) {
            if (preg_match('/code is (\d{6})/', (string) $request['sms'], $m)) {
                $code = $m[1];
            }

            return true;
        });

        $this->assertNotNull($code, 'OTP code was not captured from the SMS payload.');

        return (string) $code;
    }

    public function test_a_new_user_can_register_after_verifying_their_phone(): void
    {
        $phone = '+2348090000001';
        $code = $this->requestOtpCode($phone, 'registration');

        $this->postJson('/api/auth/verify-otp', [
            'phone' => $phone,
            'purpose' => 'registration',
            'code' => $code,
        ])->assertOk()->assertJson(['verified' => true]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Ada Lovelace',
            'phone' => $phone,
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'phone', 'role'], 'token'])
            ->assertJsonPath('user.role', 'customer');

        $this->assertDatabaseHas('users', [
            'phone' => $phone,
            'role' => 'customer',
            'is_verified' => true,
        ]);
    }

    public function test_registration_is_blocked_without_a_verified_phone(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'No Verify',
            'phone' => '+2348090000002',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');

        $this->assertDatabaseMissing('users', ['phone' => '+2348090000002']);
    }

    public function test_requesting_otp_for_an_existing_phone_registration_fails(): void
    {
        $user = User::factory()->create(['phone' => '+2348090000003']);

        $this->postJson('/api/auth/request-otp', [
            'phone' => $user->phone,
            'purpose' => 'registration',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_verify_otp_rejects_an_incorrect_code(): void
    {
        $phone = '+2348090000004';
        $this->requestOtpCode($phone, 'registration');

        $this->postJson('/api/auth/verify-otp', [
            'phone' => $phone,
            'purpose' => 'registration',
            'code' => '000000',
        ])->assertStatus(422)->assertJsonValidationErrors('code');
    }

    public function test_verify_otp_fails_when_no_code_was_requested(): void
    {
        $this->postJson('/api/auth/verify-otp', [
            'phone' => '+2348090000005',
            'purpose' => 'registration',
            'code' => '123456',
        ])->assertStatus(422)->assertJsonValidationErrors('code');
    }

    public function test_resend_within_cooldown_is_throttled(): void
    {
        $phone = '+2348090000006';

        $this->postJson('/api/auth/request-otp', ['phone' => $phone, 'purpose' => 'registration'])->assertOk();

        $this->postJson('/api/auth/request-otp', ['phone' => $phone, 'purpose' => 'registration'])
            ->assertStatus(429)
            ->assertJsonStructure(['message', 'retry_after']);
    }

    public function test_a_user_can_log_in_with_phone_and_password(): void
    {
        $user = User::factory()->create([
            'phone' => '+2348090000007',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'phone' => $user->phone,
            'password' => 'password',
            'device_name' => 'pixel-8',
        ]);

        $response->assertOk()->assertJsonStructure(['user' => ['id'], 'token']);
    }

    public function test_login_with_wrong_password_is_rejected(): void
    {
        $user = User::factory()->create([
            'phone' => '+2348090000008',
            'password' => Hash::make('password'),
        ]);

        $this->postJson('/api/auth/login', [
            'phone' => $user->phone,
            'password' => 'wrong-password',
        ])->assertStatus(422)->assertJsonValidationErrors('phone');
    }

    public function test_authenticated_user_can_fetch_self_and_log_out(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/user')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertCount(0, $user->fresh()->tokens);
    }

    public function test_user_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/auth/user')->assertUnauthorized();
    }

    public function test_password_can_be_reset_after_otp_verification(): void
    {
        $user = User::factory()->create([
            'phone' => '+2348090000009',
            'password' => Hash::make('old-password'),
        ]);
        $user->createToken('existing')->plainTextToken;

        $code = $this->requestOtpCode($user->phone, 'password_reset');

        $this->postJson('/api/auth/verify-otp', [
            'phone' => $user->phone,
            'purpose' => 'password_reset',
            'code' => $code,
        ])->assertOk();

        $this->postJson('/api/auth/reset-password', [
            'phone' => $user->phone,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertOk();

        // Old tokens revoked, new password works.
        $this->assertCount(0, $user->fresh()->tokens);
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));

        $this->postJson('/api/auth/login', [
            'phone' => $user->phone,
            'password' => 'new-password',
        ])->assertOk();
    }
}
