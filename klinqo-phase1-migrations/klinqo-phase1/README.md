# Klinqo — Phase 1 Migrations

Drop-in migrations for the Architecture v2 schema. Built for the current Laravel + Vue starter kit (Inertia/Vue 3), UUID primary keys throughout, Sanctum-ready, with Reverb used only for broadcasting (no schema needed).

## Install

1. Copy every file into `database/migrations/` of your Laravel app.
2. **Replace** the starter kit's default `0001_01_01_000000_create_users_table.php` with the one here — ours uses UUID `id`, phone-based login (`phone` unique), a `role` enum, `is_verified`, and adjusts `sessions.user_id` to a UUID foreign key. (It keeps `password_reset_tokens` and `sessions` so the starter kit's web/session auth and Inertia still work.)
3. Keep Laravel's default `cache` and `jobs` migrations as-is.
4. Run:
   ```bash
   php artisan migrate:fresh
   ```

## Models (next)

Every table expects UUIDs, so each Eloquent model should use the `HasUuids` trait and `protected $keyType = 'string'; public $incrementing = false;`. Pivots (`business_cuisine`, `business_user`) can be plain models or `belongsToMany` with `withPivot`.

## Apply order (FK-safe)

users → platform_settings → cuisines → businesses → business_cuisine → business_user → categories → menu_items → addresses → delivery_methods → promotions → orders → order_items → reviews → notifications. The timestamped filenames already enforce this.

## Delete-behavior choices (intentional)

- **orders.business_id / orders.user_id** use plain `constrained()` → DB **RESTRICT**. This protects financial history (you can't hard-delete a business or user that has orders). Add soft deletes on `businesses`/`users` if you want to "remove" them without losing orders.
- Child/owned rows (`order_items`, `categories`, `menu_items`, pivots, `addresses`, `delivery_methods`, `reviews`, `notifications`) **cascade** on parent delete.
- `orders.delivery_method_id` / `orders.address_id` and `promotions.business_id` use **nullOnDelete** so deleting a method/address/kitchen doesn't destroy order history.

## Notes

- `commission_percent` is **nullable** on `businesses` (null → fall back to `platform_settings.default_commission_percent`) and **snapshotted** on each `order` along with the computed `commission_amount`.
- `businesses.rating` / `review_count` are denormalized caches — recompute them when a review is written (Phase 8).
- The custom `notifications` table is for the in-app notification center (Phase 9). If you also enable Laravel's database notification channel, rename one to avoid a clash — we use this custom shape, not `->notify()` to DB.
- No table is needed for Reverb; order/status broadcasts ride the broadcasting layer (Phase 7).

## Next step

Generate the Eloquent models + factories + the seeder (platform settings, cuisine taxonomy, Mira's Delight with categories, menu, delivery methods, demo customer) — Phase 1 steps 4–6.
