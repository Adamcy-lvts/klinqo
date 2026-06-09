<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number')->unique();
            $table->foreignUuid('business_id')->constrained('businesses');
            $table->foreignUuid('user_id')->constrained('users');
            $table->enum('delivery_type', ['delivery', 'pickup']);
            $table->foreignUuid('delivery_method_id')->nullable()->constrained('delivery_methods')->nullOnDelete();
            $table->foreignUuid('address_id')->nullable()->constrained('addresses')->nullOnDelete();
            $table->enum('payment_method', ['online', 'pay_on_delivery', 'pay_on_pickup']);
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending')->index();
            $table->string('payment_reference')->nullable()->index();
            $table->enum('status', ['placed', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'])->default('placed')->index();
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->decimal('commission_percent', 5, 2);
            $table->decimal('commission_amount', 10, 2);
            $table->text('note')->nullable();
            $table->timestamp('placed_at')->nullable();
            $table->timestamps();
            $table->index(['business_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
