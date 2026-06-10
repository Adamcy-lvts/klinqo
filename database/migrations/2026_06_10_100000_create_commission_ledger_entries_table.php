<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commission_ledger_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->enum('type', ['accrual', 'reversal'])->default('accrual');
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['pending', 'settled', 'void'])->default('pending')->index();
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index('business_id');
            $table->unique(['order_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commission_ledger_entries');
    }
};
