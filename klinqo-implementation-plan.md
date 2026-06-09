# Klinqo — Detailed Implementation Plan

A phase-by-phase build plan from empty repo to launched app and beyond. Each phase has a **goal**, ordered **steps**, **deliverables**, and **exit criteria** (what "done" means before moving on). Built to match Architecture v2: discovery platform, per-order % commission (Paystack subaccounts + split), Paystack Pop, Termii OTP, in-app reviews, business self-onboarding, configurable delivery methods.

**Stack:** latest Laravel + the official **Laravel Vue starter kit** (Inertia 2 + Vue 3 + Tailwind) for the web admin/storefront, Sanctum for API auth, **Laravel Reverb** for websockets (live order feed), Kotlin + Jetpack Compose (customer app), MySQL 8, Redis (cache/queue/session), Paystack, Termii, Firebase Cloud Messaging, DigitalOcean + Forge.

**Sequencing principle:** backend leads; then build the **web admin** (the kitchen can't operate, and the catalog can't exist, without it), then an optional **web storefront** to reach revenue fast, then the **mobile app** against a proven API. One thin vertical slice end-to-end first (order from Mira's kitchen), then widen.

---

## Phase 0 — Foundations & environment

**Goal:** repos, tooling, CI, and a deployable skeleton on day one.

**Steps**
1. Create repos: `klinqo-api` (Laravel app — also hosts admin + storefront via Inertia) and `klinqo-app` (Kotlin). Or a monorepo with `/api` and `/app`.
2. Scaffold the app with the official **Laravel Vue starter kit** (`laravel new klinqo --vue`, the non-WorkOS variant so we control phone+OTP auth) — this gives Inertia 2 + Vue 3 + Tailwind + auth scaffolding out of the box. Then add Sanctum (API tokens for the mobile app), **Laravel Reverb** (`php artisan install:broadcasting` → Reverb), Ziggy, Laravel Pint, Larastan, and Pest.
3. Configure `.env`: MySQL, Redis (cache + queue + session), mail, Reverb keys, and placeholders for `PAYSTACK_*`, `TERMII_*`, `FCM_*`.
4. Set up queue worker (Redis) and scheduler; verify `php artisan queue:work` and a test job. Run **Reverb** (`php artisan reverb:start`) and confirm a test broadcast reaches a browser client; on the server it runs as a long-lived Forge daemon alongside the queue worker.
5. Scaffold the Android project: Kotlin, Jetpack Compose, Hilt, Retrofit + OkHttp + Moshi/kotlinx-serialization, Coil, Room, Navigation-Compose. Set `debug`/`release` variants and `BuildConfig.API_BASE_URL` per variant.
6. Establish the shared design system from the prototype on both surfaces: color tokens (primary `#FF6B35`), typography (display + body), spacing, radii. On web: a Tailwind theme + shared Vue components. On app: shared Composables (PrimaryButton, TextField, QtyStepper, ScreenHeader, BottomNav, Toast).
7. CI: GitHub Actions — API runs Pint + Larastan + Pest on PR; app runs `./gradlew ktlintCheck assembleDebug`.
8. Provision a staging server on DigitalOcean via Forge; deploy the empty Laravel app; staging subdomain; HTTPS.

**Deliverables:** running staging API (health endpoint), starter-kit login page, Android app launching to a placeholder, green CI.

**Exit criteria:** commit to `main` auto-deploys to staging; app debug build hits the staging health endpoint; a Reverb test event reaches the browser.

---

## Phase 1 — Database & domain models

**Goal:** the full v2 schema migrated, seeded, and queryable.

**Steps**
1. Apply the Phase 1 migrations (the 15 already generated): `users` (UUID + phone, replaces the starter-kit default), `platform_settings`, `cuisines`, `businesses`, `business_cuisine`, `business_user`, `categories`, `menu_items`, `addresses`, `delivery_methods`, `promotions`, `orders`, `order_items`, `reviews`, `notifications`.
2. Build Eloquent models with `HasUuids`, relationships, casts, and the denormalized `rating`/`review_count` on `businesses`.
3. Add model factories for every table.
4. Write the seeder: platform settings (default commission %), cuisine taxonomy, Mira's Delight (status active), its categories, ~13 menu items, delivery methods (Pickup ₦0, Standard delivery), and a demo customer.
5. Add shared scopes/helpers: `Business::active()`, `MenuItem::available()`, an order-number generator (`KLQ-####`).

**Deliverables:** migrated DB, seeders, factories, models with relationship tests.

**Exit criteria:** `migrate:fresh --seed` produces a fully browsable Mira's kitchen; relationship tests pass.

---

## Phase 2 — Authentication (phone + Termii OTP)

**Goal:** customers and owners register and log in by phone with OTP. Backend + shared auth.

**Steps**
1. Termii service wrapper: send OTP, Redis-stored code (TTL ~5 min), attempt limits, resend cooldown (45s).
2. Endpoints: `POST /auth/request-otp`, `POST /auth/verify-otp`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/user`. API clients (the app) use Sanctum tokens; the web admin/storefront use the starter kit's session guard.
3. Set `is_verified` on success; rate-limit OTP and login routes.
4. Roles: default `customer`; `business_owner` set at onboarding (Phase 10); `admin` seeded.
5. Password reset by phone (request OTP → set new password).

**Deliverables:** working auth on the backend, callable by both web and app.

**Exit criteria:** a new phone can register, verify, log in (token + session both work), and bad/expired OTP and rate limits behave correctly.

---

## Phase 3 — Kitchens, discovery & menu API

**Goal:** the discovery layer and menu data both clients need.

**Steps**
1. Endpoints: `GET /cuisines`; `GET /kitchens` (list/search with `?cuisine=`, `?q=`, pagination, sort by distance/rating); `GET /kitchens/{id}`; `GET /kitchens/{id}/menu`; `GET /kitchens/{code}` (resolve by QR/business code).
2. Cross-kitchen search matching the prototype: query matches kitchen name, cuisine, or item names; return kitchen matches plus menu matches for the active kitchen.
3. Membership: `POST /kitchens/{id}/join`, `GET /me/kitchens`.
4. `GET /menu-items/{id}` for detail; include `is_popular`.
5. Redis caching for cuisines + menus with invalidation on edits.
6. API resources for consistent JSON; feature tests for discovery, search, join, menu.

**Deliverables:** discovery + menu API with tests.

**Exit criteria:** list cuisines, search kitchens by cuisine and dish, resolve by code, join, fetch full menu.

---

## Phase 4 — Orders, checkout & payments (backend)

**Goal:** the server-side order engine both the storefront and the app will call — money moves, commission is correct, statuses flow. (Clients consume this in Phases 5–7.)

**Steps**
1. Order creation: `POST /orders` validates the cart server-side (re-price from DB — never trust client prices), applies the chosen `delivery_method` fee, snapshots `commission_percent`, computes `commission_amount`, sets `payment_method`/`delivery_type`, returns the order.
2. Paystack init: `POST /payments/initialize` creates a transaction tied to the kitchen's `paystack_subaccount_code` with a split retaining the platform commission; returns access code/reference for Pop.
3. Webhook: `POST /webhooks/paystack` verifies signature, marks `payment_status=paid`, moves order to `confirmed`, idempotent on retries; plus a server-side `verify` fallback.
4. Cash flows: `pay_on_delivery`/`pay_on_pickup` create the order as `placed`, `payment_status=pending`, and write a commission ledger accrual.
5. Status machine + events: enforce `placed → confirmed → preparing → ready → delivering → delivered` (+ `cancelled`); reject illegal transitions; **broadcast each transition over Reverb** and fire events for notifications (Phase 9).
6. Order read APIs: `GET /orders`, `GET /orders/{id}`, `GET /orders/{id}/track`, `POST /orders/{id}/cancel` (only in `placed`/`confirmed`). Addresses CRUD: `addresses` endpoints.
7. Tests: pricing, commission math, split init, webhook idempotency, cash accrual, state-machine legality.

**Deliverables:** a complete, tested order/payment backend.

**Exit criteria:** an online order can be created + paid via a test Paystack transaction and confirmed by webhook with the split correct; a cash order accrues commission; illegal status jumps are blocked.

---

## Phase 5 — Web admin (kitchen console)

**Goal:** the kitchen can operate — set up its menu and receive/process orders. This must come before any customer surface, because the catalog lives here.

**Steps**
1. Admin layout + guard: starter-kit auth for `business_owner`/`admin`, sidebar (Dashboard, Orders, Menu, Customers, Reports, Settings), tenant scoping so an owner only sees their kitchen.
2. **Menu management first:** category CRUD; item CRUD with image upload (object storage), availability + popular toggles, drag-to-reorder. (This is what makes the app/storefront non-empty.)
3. Delivery methods CRUD (name, description, fee, active) — fees live here.
4. Business settings: name, logo, cover, description, phone, address, area, hours, cuisines, payment toggles.
5. Dashboard: today's orders, revenue, pending count, active items; recent orders; quick actions.
6. **Live incoming-orders view:** order events broadcast over **Laravel Reverb** (Laravel Echo on the Vue side) so new orders appear instantly with sound + visual alert; accept/reject and advance status inline — no polling.
7. Orders table: filterable (date + status tabs), order detail, status controls.
8. Customers: the kitchen's members with order count + total spent; detail with history.
9. Reports: orders/revenue over time, by category, AOV, popular items, peak times; CSV export.

**Deliverables:** a working operator console for Mira.

**Exit criteria:** Mira logs in, builds her full menu + delivery fees, and a test order (placed via API) appears live with a sound and can be advanced to delivered.

---

## Phase 6 — Web customer storefront (fast on-ramp to revenue)

**Goal:** a thin mobile-web ordering page so real customers can order via a link/QR before the Android app clears store review. Optional but recommended for the pilot.

**Steps**
1. Public Inertia/Vue storefront (mobile-first, installable PWA): resolve a kitchen by `code`/slug, show its menu.
2. Customer flow: browse menu → item detail → cart → checkout (delivery method, address, payment) → **Paystack Pop** (web inline) → success → order tracking page.
3. Lightweight customer auth: phone + OTP (reuse Phase 2), or guest checkout with phone capture — decide based on friction tolerance.
4. Tracking page reads order status live over Reverb (or simple refresh) so customers see progress.
5. Generate Mira's QR linking to her storefront URL for her shop counter and WhatsApp status.
6. Tests + a manual end-to-end on a phone browser.

**Deliverables:** a shareable web storefront Mira can take live immediately.

**Exit criteria:** a real customer opens the link on their phone, orders, pays via Paystack, and the order lands in the Phase 5 admin live.

---

## Phase 7 — Mobile customer app (Kotlin)

**Goal:** the primary long-term customer surface, built against the now-proven API.

**Steps**
1. Auth screens: Splash, Welcome, QR scan (CameraX + ML Kit), Enter-code, Register, OTP (6-box + countdown), Login; secure token storage (EncryptedSharedPreferences); auth interceptor + expiry handling; auto-route to Home if logged in.
2. Nav shell: bottom nav (Home, Orders, Cart badge, Profile) + push/replace/pop stack matching the prototype.
3. Discovery + menu: Home (kitchen switcher, search, promo carousel, cuisine circles, popular, menu grid); Search (browse-by-cuisine, recent searches, split results); kitchen profile + join; item detail.
4. Cart: Room-backed per active kitchen; qty steppers, notes, remove; subtotal; promo field (UI until Phase 11); proceed to checkout.
5. Checkout: delivery method selector (from API), address selector (+ add address), payment selector filtered by kitchen toggles + delivery type, note, summary, place order.
6. Online payment via the **Paystack Android SDK / Pop**; confirm with backend; handle cancel/fail. No card data on Klinqo.
7. Order success; Orders list (Active/Past, status badges); Order tracking (vertical stepper, live via status fetch); cancel; reorder.
8. Profile, addresses, business switcher screens.
9. Loading/empty/error states everywhere; pull-to-refresh; Coil image placeholders.

**Deliverables:** a complete customer app from discovery → order → pay → track.

**Exit criteria:** a user can QR-join or discover a kitchen, order, pay via Paystack popup, and watch status update; switching kitchens swaps the menu.

---

## Phase 8 — Reviews

**Goal:** verified, order-based reviews on kitchens.

**Steps**
1. Endpoints: `POST /orders/{id}/review` (delivered-only, one per order), `GET /kitchens/{id}/reviews`.
2. On submit, store and recompute the kitchen's cached `rating`/`review_count`.
3. Surfaces: Rate-order + Reviews screens on the app; reviews shown on the storefront kitchen page; a prompt after delivery.
4. Admin: surface reviews on the dashboard with basic hide/report.
5. Tests for eligibility and rating recomputation.

**Deliverables:** reviews end-to-end.

**Exit criteria:** a delivered order can be reviewed once; the kitchen average updates; reviews show on its profile.

---

## Phase 9 — Notifications (FCM + in-app)

**Goal:** customers get order updates and promos.

**Steps**
1. FCM: register device tokens (`POST /devices`), store per user, prune stale.
2. Push on order status events (confirmed, preparing, out for delivery, delivered) and promos.
3. Persist in `notifications`; `GET /notifications`, `POST /notifications/read`.
4. App: permission flow, foreground/background handling, deep links, Notifications screen with unread state. (Web storefront/admin can use Reverb toasts for in-session updates.)
5. Tests for fan-out on status change and read/unread.

**Deliverables:** push + in-app notification center.

**Exit criteria:** advancing an order pushes to the customer and appears in the list; tapping deep-links to the order.

---

## Phase 10 — Business self-onboarding + Paystack subaccounts

**Goal:** new kitchens can sign themselves up.

**Steps**
1. Onboarding flow (web): owner sign-up → business details → location & hours → cuisines → payout/bank. Persist `onboarding_step` to resume.
2. On payout submit, create a **Paystack subaccount**, store `paystack_subaccount_code`; validate the account via Paystack resolve.
3. Set `status=pending`; admin review queue to approve → `active`; on approval issue `business_code` and generate the QR to storage.
4. "Ready" screen with code/QR; owner lands in the dashboard.
5. Platform-admin: approval queue, suspend/reactivate, set per-kitchen `commission_percent`.
6. Tests for onboarding state, subaccount creation (mocked), approval gating.

**Deliverables:** a second kitchen can onboard without DB access.

**Exit criteria:** a new owner completes onboarding, is approved, gets a code + QR, and split payments route to their subaccount.

---

## Phase 11 — Promotions

**Goal:** promo banners and codes (e.g. WELCOME free delivery).

**Steps**
1. `promotions` CRUD (platform-wide or per-kitchen); types: free delivery, % off, flat off; validity window + active flag.
2. Apply at checkout: `POST /orders/validate-promo`; recompute totals; record the applied promo on the order.
3. Wire the promo field in cart/checkout (app + storefront); render promo banners on Home from the API.
4. Tests for validity, no-stacking rule, total recomputation.

**Deliverables:** working promo codes + banners.

**Exit criteria:** WELCOME applies free delivery on a first order and totals update; expired/invalid codes are rejected.

---

## Phase 12 — Hardening, security, performance, QA

**Goal:** production-grade quality.

**Steps**
1. Security: rate limiting on auth/OTP/payments; authorize every endpoint (policies for tenant scoping); verify Paystack webhooks; never log secrets; lock CORS; enforce HTTPS; secure the Reverb connection.
2. Money correctness: reconcile a day of test orders — customer charge = subtotal + delivery; platform commission + kitchen payout = expected; cash accruals tally.
3. Idempotency: order placement and webhook handling safe under retries/double-taps.
4. Performance: index FKs and common filters; eager-load to kill N+1 (Telescope/Larastan in staging); cache menus/cuisines; paginate everything.
5. App QA: offline/error states, slow network, image fallbacks, back-stack, screen sizes, Android version matrix.
6. Coverage: feature tests for every endpoint; key app flows via instrumentation tests; a manual end-to-end script (discover → join → order → pay → track → review) on both storefront and app.
7. Observability: Sentry on API + app; structured logs; uptime + queue + Reverb monitoring; your existing server-hardening monitors.
8. Legal/store prep: privacy policy, terms, Play Store listing assets, data-safety form.

**Deliverables:** hardened, observable build with passing tests.

**Exit criteria:** clean security pass, reconciled money flows, green suite, no critical QA bugs.

---

## Phase 13 — Deployment & launch (Mira pilot)

**Goal:** real customers ordering from Mira's Delight.

**Steps**
1. Production infra on Forge: app server, MySQL, Redis, queue workers, scheduler, **a Reverb daemon** (long-lived, proxied for secure websockets), daily backups, log rotation; your standard hardening (UFW, SSH, monitoring).
2. Production credentials: Paystack live keys + live subaccount for Mira, Termii live sender ID, FCM production config, object storage + CDN.
3. Configure Mira's live kitchen: real menu, photos, delivery zones/fees, hours; print her QR (storefront now, app later).
4. **Storefront launch first:** take the web storefront live so Mira can accept real orders immediately while the app finishes store review.
5. Release the app: signed release build, Play Console internal → closed → production (or pilot APK if faster).
6. Soft launch: a handful of real orders end-to-end; watch logs, payments, notifications live.
7. Train Mira on the dashboard; go live; monitor closely; hotfix loop ready.

**Deliverables:** Klinqo live with Mira's Delight; first paid orders.

**Exit criteria:** real customers place and pay, Mira fulfills via the dashboard, commission settles correctly, and you have a working case study.

---

## Phase 14 — Post-launch & scaling to more kitchens

**Goal:** turn the pilot into a platform.

**Steps**
1. Pilot feedback (customers + Mira); fix friction; tune ETAs and fees.
2. Onboard 2–3 more kitchens via self-serve; validate multi-tenant isolation + discovery with real variety.
3. Add rider/dispatch capability if delivery volume warrants.
4. Analytics: retention, repeat-order rate, per-kitchen revenue, commission take.
5. Iterate discovery (location gating, ranking), reviews, promos from data.
6. Automate cash-order commission settlement (scheduled netting/invoicing).
7. Plan iOS if demand appears.

**Deliverables:** multiple live kitchens, retention data, a repeatable onboarding motion.

**Exit criteria:** more than one kitchen operating profitably with healthy repeat orders — the signal to invest further.

---

## Cross-cutting checklists

**Definition of done (per feature):** endpoint + validation + authorization + tests; client UI wired with loading/empty/error states; analytics/event where relevant; documented in the API reference.

**Never-skip security rules:** server-side re-pricing at checkout; verified webhooks; tenant-scoped queries; rate-limited auth; no card data on Klinqo servers; secrets only in env.

**Build spine (must-have):** Phases 0–5 get you a backend + an operating kitchen console. Phase 6 (storefront) is the fastest path to real revenue. Phase 7 (app) is the long-term surface. 8–9 round out usability, 10–11 unlock growth, 12–13 ship it, 14 scales it. If time-boxed, you can launch the pilot on Phases 0–6 alone and add the app next.
