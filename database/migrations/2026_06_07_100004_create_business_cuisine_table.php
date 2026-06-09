<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_cuisine', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignUuid('cuisine_id')->constrained('cuisines')->cascadeOnDelete();
            $table->unique(['business_id', 'cuisine_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_cuisine');
    }
};
