# Kitchen Console — Design Brief

> **Use the Savora design system — with a deliberate twist.** This console must
> be built from the **same** system as the **Savora Operations Console** (the
> platform admin panel): same components, type, spacing, radii, shadows, and
> motion. But it must be **instantly distinguishable** from the platform console
> at a glance, so an operator always knows which surface they're on. Do **not**
> invent a new visual language — express the difference through the system's own
> levers (accent, brand, density). See **"The twist"** and **"Design system"**
> below.

## The twist — same system, distinct surface
The two consoles are siblings, not twins. Keep everything structural identical;
change only these, so the kitchen console feels like *the operator's own kitchen*
rather than *the platform HQ*:

1. **Different accent (primary differentiator).** The platform console uses
   **Savora orange `#FF6B35`**. Give the kitchen console a different accent from
   the system's built-in presets — recommended **Herb green `#1F8A5B`** (dark
   `#16704A`) — applied everywhere the accent appears (primary buttons, active
   nav, focus rings, chart lines, KPI sparklines, status "active"/"en route"
   tints). Saffron `#E0A100` or Berry `#C2185B` are acceptable alternates. Pick
   one and use it consistently. *(The system already supports accent presets, so
   this is a token swap, not a redesign.)*
2. **Brand block = the kitchen, not the platform.** Sidebar top shows the
   **kitchen's own logo + name** with a small **"Kitchen"** kicker (where the
   platform shows the Savora mark + "Operations"). This is the clearest "you are
   here" signal.
3. **Operational, denser feel.** This is a working line during a rush, not an
   analytics HQ. Lead with the live **Orders** workflow; lean on the compact
   density and let charts/insights be secondary (Reports only). The platform
   console leads with big GMV/trend analytics — the kitchen console leads with
   "what do I cook next."
4. **Optional warmth cue.** A subtly warmer surface tint or a small kitchen badge
   is fine, but keep it within the Savora token ranges — don't drift the whole
   palette.

Net effect: identical bones and components, but the green accent + kitchen brand +
order-first layout make it unmistakable at a glance which console you're in.

## Who uses it & what it is
The **kitchen owner/operator** (e.g. Mira of "Mira's Delight"). Unlike the
platform admin (who oversees *all* kitchens), this person manages **one
kitchen**: their incoming orders, menu, fees, customers, reviews, and reports.
Everything is scoped to their own kitchen. Currency is Naira (₦). It's a web app
(desktop-first, but owners will use phones heavily), reached at `/dashboard`
after the standard login.

## Global frame
Same shell as the Savora console:
- **Left sidebar** (collapsible, brand at top, user/account at bottom) with these
  nav items: **Dashboard, Orders, Menu, Delivery methods, Customers, Reviews,
  Reports, Settings**.
- **Top header** with a breadcrumb (e.g. "Dashboard › Orders") and a sidebar
  toggle; same sticky, blurred header treatment as Savora.
- Light/dark support; rounded bordered cards; ₦ formatting throughout.
- The brand mark in the sidebar is the **kitchen's own name/logo** (not
  "Savora") — this is the owner's kitchen, not the platform.

---

## Screen 1 — Dashboard (`/dashboard`)
The owner's home. Top to bottom:
- **Kitchen header:** kitchen name, public **business code**, and **status**
  (active / pending / suspended).
- **Storefront card:** a **QR code** + the shareable storefront link ("Share this
  link or print the QR for your counter").
- **4 KPI stat cards:** *Orders today*, *Revenue today* (₦, paid), *Pending
  orders*, *Active menu items*. (Reuse the Savora KPI card — sparkline optional.)
- **Recent orders table** (latest ~8): Order #, Status, Payment, Total.
- **Empty state** (no kitchen yet): "Set up your kitchen" prompt → onboarding.

## Screen 2 — Orders list (`/orders`)
The operational heart — a **live feed** (auto-refreshes via websockets when a new
order is placed or its status changes; mock a "new order just arrived" moment).
- **Status filter pills:** All + each status with a live count — *placed,
  confirmed, preparing, ready, delivering, delivered, cancelled* (reuse Savora's
  segmented control / status pills).
- **Table:** Order # (links to detail), Customer, Status, Payment, Total.
  Paginated.
- Empty = "No orders."

## Screen 3 — Order detail (`/orders/{id}`)
- **Header:** order number; subline "status · payment · delivery type".
- **Status action buttons** — only the *legal next steps* for the current status
  (e.g. from *preparing* → "Mark ready" / "Mark cancelled"). Cancel is
  destructive. Flow: placed → confirmed → preparing → ready →
  delivering/delivered (cancellable until delivering).
- **Items table:** each line "qty × item — ₦price", then Subtotal, Delivery,
  **Total**.
- **Customer/fulfilment card:** customer name + phone, delivery address, delivery
  method, and any order note.

## Screen 4 — Menu (`/menu`)
Manage the catalog: **categories** (emoji + active flag), each holding **menu
items**. The most interaction-heavy screen.
- Per **item**: name, description, **price (₦)**, image, **availability toggle**,
  **"popular" flag**, drag **sort order**.
- Actions: add category (inline: name + emoji), delete category (confirm; deletes
  its items), add item (form with **image upload**), edit item, delete item,
  toggle availability, **drag-reorder** categories and items.
- Design needs: dense but clean category × item layout, fast inline editing,
  image thumbnails, obvious available/unavailable + "popular" states.

## Screen 5 — Delivery methods (`/delivery-methods`)
- List: **name, description, fee (₦), active toggle**, sort order.
- Actions: add, edit, delete, activate/deactivate (e.g. "Pickup ₦0", "Standard
  delivery ₦600").

## Screen 6 — Customers (`/customers`)
- People who have ordered from **this kitchen**. List: name, phone/email, **order
  count**, **total spent (₦, paid)** — sorted by order count, paginated. (Reuse
  Savora's customer table + avatar/tier patterns.)
- **Customer detail (`/customers/{id}`):** contact info + that customer's order
  history (order #, status, payment, total, date).

## Screen 7 — Reviews (`/reviews`)
- **Summary:** average **rating (★)** and total review count.
- **List:** rating, text, customer name, linked order #, date.
- Action: **hide/unhide** a review (hidden reviews drop out of the public
  rating). Show hidden state clearly.

## Screen 8 — Reports (`/reports`)
- **Date-range picker** (from/to; default = last 14 days).
- **Summary cards:** Orders, Revenue (₦, paid), **Average order value**.
- **Revenue-by-day** → a line/area **chart** (revenue + order count per day) —
  reuse the Savora AreaChart.
- **Top items** (top 10): item name, quantity sold, revenue.
- **Export CSV** button (orders within range).

## Screen 9 — Settings (`/business/settings`)
Kitchen profile editing (reuse Savora's Settings rows/toggles/cards):
- **Profile:** name, tagline, description, phone, email, address, area.
- **Prep time:** min/max minutes.
- **Order channels (toggles):** accepts online payment, accepts pay-on-delivery,
  accepts pay-on-pickup.
- **Operating hours** (per-day schedule).
- **Branding:** logo upload, cover image upload.
- **Cuisines:** multi-select tags (global cuisine list, each with an emoji).

---

## Reference data (for realistic mockups)
- **Order status:** placed → confirmed → preparing → ready → delivering →
  delivered (or cancelled).
- **Payment status:** pending / paid / failed / refunded.
- **Payment method:** online / pay-on-delivery / pay-on-pickup.
  **Delivery type:** delivery / pickup.
- **Kitchen status:** active / pending / suspended.
- The owner sees **only their own kitchen's** data (no cross-kitchen views — that
  is the platform admin's job).

## States to mock
- **Populated** (busy lunch rush — several live orders in different statuses),
  **empty** (brand-new kitchen, no orders/menu), and a **live "new order
  arrived"** moment on the Orders feed.

---

## Design system (reuse from Savora — do not redesign)
Match the existing platform admin exactly. The Savora system already in the repo:

**Tokens** (`resources/css/savora.css`, scoped to `.sav-root`):
- Brand: keep the token structure but **override the accent** for this console —
  `--sav-primary: #1F8A5B` (herb green), `--sav-primary-dark: #16704A`, with the
  soft/tint variants derived from it. (The platform console keeps
  `#FF6B35`/`#E55A29`.) This single swap is the main visual differentiator — see
  "The twist."
- Surfaces: bg `#FFF7F2`, surface `#FFFFFF`, surface-2 `#FBF1E9`.
- Ink: `#1F1410` / `#5A4438` / `#9C8578` / `#C8B5A8`.
- Borders `#F0DFCF` / `#E5CFB9`; success `#1F8A5B`, warn `#E0A100`, danger
  `#D64545`.
- Radii 10/16/22/28px; three shadow tiers.
- **Type:** display = **Bricolage Grotesque**, text = **Plus Jakarta Sans**.

**Components** to reuse (`resources/js/savora/`): Card, Button (primary/secondary/
ghost/soft), IconButton, StatusPill, TierBadge, DeltaChip, Avatar, KitchenAvatar,
SearchInput, Segmented, SectionTitle, the table shell (TableShell/TR/TD/
TableToolbar/Pagination), the charts (AreaChart/BarChart/DonutChart/Sparkline/
MiniBar), and the Sidebar/Topbar shell.

**Reference:** the platform admin lives at `/platform/console`
(`resources/js/savora/`) — use it as the visual source of truth. The only
differences here are: single-kitchen scope, kitchen-owner nav items, and the
sidebar brand showing the kitchen's own name/logo instead of "Savora".
