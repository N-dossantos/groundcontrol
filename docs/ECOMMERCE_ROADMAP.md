# Ground Control 90 — Ecommerce Implementation & Upgrade Roadmap

> Status snapshot: the app is **fully built and verified against local Docker Supabase**, but nothing is deployed and no real payment has ever been processed. Mercado Pago is **already fully coded** (Checkout Pro redirect flow) — it just has empty credentials and has never run live. This roadmap covers getting it live, hardening it, and layering new capabilities on top.

This document follows `AGENTS.md`: no backward-compat layers, remove obsolete paths instead of adding fallbacks, choose the simplest implementation that fully meets the requirement, grow the system in layers on a product that already works, reuse existing dependencies/helpers, and edit `supabase/migrations/0001_init_schema.sql` in place (no patch migrations until the first shared deploy), regenerating `src/types/database.types.ts` after any schema change.

---

## Current state (what already exists — do not rebuild)

Storefront, cart (Zustand + `localStorage`), guest **and** logged-in checkout, atomic stock reservation with a 30-minute TTL + cron release, Mercado Pago Checkout Pro (redirect) with a signature-verified webhook + refund, coupons, Resend order emails, and an admin panel (product/variant/image CRUD, order status + refund, coupons, settings, read-only reports/customers), all behind layered Postgres RLS. Not deployed; Mercado Pago / Resend / Google-OAuth credentials are unset; the payment flow has never been exercised live.

Solid foundations worth preserving as-is: row-locked atomic stock reservation (`create_order_and_reserve_stock`), idempotent release (`release_order_reservation`), guest checkout via an unguessable `confirmation_token`, webhook signature verification + payment re-fetch (never trusting the webhook body), and refund with an `audit_logs` entry.

---

## Phase 0 — Going-live foundation (deploy prerequisites)

Execute the `CLAUDE.md` "Going live" checklist, in order. These block everything Mercado-Pago-live.

1. **Push to GitHub.** The repo currently has only the original `create-next-app` commit; all app code is untracked. Vercel deploys from a git repo, so this comes first.
2. **Create a production Supabase project.** `supabase link --project-ref <ref>` + `supabase db push` to apply `0001_init_schema.sql`. Skip `seed.sql` in production (it includes the test admin). Grab the project URL / `anon` key / `service_role` key.
3. **Set all production env vars in Vercel** (see `.env.local.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (the real domain), `RESEND_API_KEY` + a verified `EMAIL_FROM_ADDRESS`, `CRON_SECRET`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.
4. **Configure Google OAuth.** Only a disabled Apple template block exists today. Create Google Cloud OAuth credentials (authorized redirect URI = the Supabase project's `.../auth/v1/callback`), then enable + configure the Google provider in the Supabase Auth dashboard.
5. ~~Resolve `font-stat`~~ — done: swapped to Barlow Condensed Bold via `next/font/google` (Liberation Sans Narrow Bold was pulled from its upstream repo over licensing problems).
6. **Deploy to Vercel**, add the custom domain, then sync `NEXT_PUBLIC_SITE_URL` and the Supabase Auth **Site URL** + redirect allow-list to the real domain (stale URLs silently break OAuth / email-confirmation links).
7. **Promote a real admin** (`profiles.role = 'admin'`) via the Supabase SQL editor. The local test admin is not for production.

---

## Phase 1 — Mercado Pago: get it live & tested (the "full MP plan")

The core of this request. Four sub-steps.

### 1a. Credentials & configuration (sandbox first)
- Create a Mercado Pago application in the MP developer dashboard. Use the **test (sandbox)** `MP_ACCESS_TOKEN` first, then production credentials.
- Register the webhook URL `https://<domain>/api/webhooks/mercadopago` and set `MP_WEBHOOK_SECRET` to the value MP issues. An empty secret makes the SDK's `WebhookSignatureValidator.validate` reject **every** webhook (→ 401), so nothing downstream fires.
- **Public HTTPS is required:** `back_urls` + `auto_return: "approved"` (set in `src/lib/mercadopago/preference.ts`) are rejected by MP for `localhost`. Sandbox testing must run against a **Vercel preview deploy** (or a public tunnel), not `http://localhost:3000`.

### 1b. Fix the known gaps (small, targeted code changes)
- **Fail-fast env validation.** `src/lib/mercadopago/client.ts` and `src/lib/mercadopago/webhookVerify.ts` read `process.env.MP_*!` with no guard, so missing config surfaces as cryptic runtime SDK errors. Add an explicit check that throws a clear "Mercado Pago not configured" error.
- **Refund reconciliation in the webhook.** `src/app/api/webhooks/mercadopago/route.ts` only transitions the order when `order.estado === 'pendiente_pago'`. A refund issued from the MP dashboard arrives as `payment.status === 'refunded'` on an already-`pagado` order — the `payments` row flips to `reembolsado` but `orders.estado` never does, desyncing status. Add a branch: on `refunded`, idempotently set `orders.estado = 'reembolsado'`.
- **`payments` row lifecycle.** Today the `payments` row is first created only by the webhook, and the refund route requires an `estado='aprobado'` row to exist. If the webhook never fires (bad `notification_url`), a paid order is stuck un-`pagado` and un-refundable. Create a `payments` row (`estado='pendiente'`, with `mp_preference_id`) at checkout in `src/app/api/checkout/crear-preferencia/route.ts`, and let the webhook upsert it (the `mp_payment_id` unique constraint already backs the upsert).
- **Result-page "not found / expired" UX.** `src/components/checkout/CheckoutResultPage.tsx` silently renders without the order summary card when the confirmation token is missing/expired. Add an explicit not-found state with a WhatsApp fallback.
- **Remove obsolete paths (per AGENTS.md).** Delete the unused `NEXT_PUBLIC_MP_PUBLIC_KEY` env (no Bricks/client SDK in the pure-redirect flow) and the dead `src/app/api/pedidos/confirmacion/route.ts` GET endpoint (result pages call `getOrderByConfirmationToken` in `src/lib/orders.ts` directly). Do not keep them "just in case."

### 1c. End-to-end sandbox test (on a preview deploy)
Verify each leg with MP test cards:

| Scenario | Expected |
|---|---|
| Approved payment | redirect to `/checkout/exito` → webhook marks order `pagado` → confirmation email sent (`sendOrderConfirmationEmail`) |
| Rejected payment | `/checkout/error` → webhook calls `release_order_reservation` → stock + coupon usage restored |
| Pending payment | `/checkout/pendiente` |
| Admin total refund | `payments` + `orders` → `reembolsado`, `audit_logs` row written |
| MP-dashboard refund | webhook `refunded` branch (1b) reconciles `orders.estado` |
| Reservation expiry | unpaid order > 30 min → cron `/api/cron/liberar-reservas` releases it |

### 1d. Go live
Swap sandbox credentials for production `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` in Vercel, re-point the registered webhook to the production domain, and run one small real transaction as a smoke test.

---

## Phase 2 — Payments & checkout upgrades

- **Reuse saved addresses at checkout.** The `addresses` table + `AddressesManager` exist, but `CheckoutForm` always makes users retype. Add an address picker for logged-in users that prefills the `direccion` fields.
- **Partial refunds.** `src/app/api/admin/pedidos/[id]/reembolsar/route.ts` calls `PaymentRefund.total(...)`. Add an optional `amount` for partial refunds; reflect partial vs. full in the `payments`/`orders` status and the audit log.
- **Installments (cuotas).** Checkout Pro supports installments via the preference `payment_methods` config. Expose/verify `installments` in `buildPreferenceBody` (`src/lib/mercadopago/preference.ts`) so buyers can pay in cuotas.
- **Checkout hardening.** Add rate limiting to `POST /api/cupones/validar` (coupon-code brute force) and `POST /api/checkout/crear-preferencia`.

---

## Phase 3 — Search & merchandising

- **Real search.** Replace the `ilike` on `products.nombre` only (in `getProducts`, `src/lib/products.ts`) with a Postgres full-text index (`tsvector` over nombre + club + liga + descripcion), and move the `talle` filter from post-query JS into SQL via the joined variants. Edit `0001_init_schema.sql` in place, then regenerate types.
- **Pagination.** `getProducts` and the admin list pages load all rows. Add limit/offset (or keyset) pagination to `/catalogo` and the admin product/order lists.
- **Product reviews/ratings.** New `product_reviews` table (RLS: buyers write their own, public read, admin moderate), displayed on `productos/[slug]` with an average-rating badge on cards.
- **Wishlist/favorites.** New `wishlists` table tied to `auth.uid()` (RLS), a heart toggle on product cards/detail, and a `/cuenta/favoritos` page.
- **Related products.** Simple "same club / same tipo" recommendations on the product detail page (no ML needed).

---

## Phase 4 — Ops & growth

- **Analytics + SEO.** Add GA4 or Plausible (+ optional Meta pixel); verify/emit `sitemap.ts` / `robots.ts` and add JSON-LD Product structured data on `productos/[slug]`.
- **Abandoned-cart recovery.** Requires server-persisted carts (the cart is `localStorage`-only today). Introduce a `carts` table keyed by user/session so a scheduled job can email reminders — flagged as a larger design item.
- **Admin UX.** Customer drill-down to their orders + promote-to-admin from the UI (today requires the Supabase dashboard); CSV export of orders/products; bulk status edits.
- **Email robustness.** Emails are fire-and-forget (`src/lib/email/`). Add retry/queue, an admin "new order" notification, and a low-stock alert (low stock is only a dashboard count today).

---

## Out of scope (deprioritized this cycle)

Fulfillment/shipping upgrades — real carrier rates/zones, free-shipping thresholds, tracking numbers, and a public "track my order" page — are noted but **not** planned now. The store keeps its single flat `costo_envio_domicilio` + pickup-point model.

---

## Cross-cutting engineering rules

- Any schema change edits `supabase/migrations/0001_init_schema.sql` in place, then `npx supabase db reset` + `npx supabase gen types typescript --local > src/types/database.types.ts`.
- Pick the right Supabase client per trust boundary: `public.ts` for SSG catalog reads, `server.ts` for session-scoped reads, `client.ts` for browser components, `admin.ts` only inside trusted API routes.
- Prefer existing helpers (`getProducts`, `getAppSettings`, `getOrderByConfirmationToken`, `sendOrderConfirmationEmail`, the reservation RPCs) over new code; remove dead paths rather than layering.

---

## Critical files by phase

- **Mercado Pago (Phase 1):** `src/lib/mercadopago/{client,preference,webhookVerify}.ts`, `src/app/api/checkout/crear-preferencia/route.ts`, `src/app/api/webhooks/mercadopago/route.ts`, `src/app/api/admin/pedidos/[id]/reembolsar/route.ts`, `src/components/checkout/CheckoutResultPage.tsx`, `src/lib/orders.ts`.
- **Search & merchandising (Phase 3):** `src/lib/products.ts`, `src/app/(site)/catalogo/page.tsx`, `src/app/(site)/productos/[slug]/page.tsx`, `supabase/migrations/0001_init_schema.sql`.
- **Checkout upgrades (Phase 2):** `src/components/checkout/CheckoutForm.tsx`, `src/lib/validations/checkout.ts`.
- **Ops (Phase 4):** `src/lib/email/*`, `src/app/admin/**`, `src/app/(site)/layout.tsx` (analytics), `sitemap.ts` / `robots.ts`.

---

## Verification

- For Phase 1 code work: `npm run build` + `npm run lint` clean; `npx supabase db reset` applies cleanly and `gen types` produces no surprising diff; then run the **1c sandbox test matrix** on a Vercel preview deploy (approved / rejected / pending / refund / dashboard-refund / reservation-expiry), watching Vercel function logs for webhook signature validation and the MP payment re-fetch.
