# Ground Control 90 — Ecommerce Implementation & Upgrade Roadmap

> Status snapshot: the app is **deployed to Vercel production** (`https://groundcontrol90.vercel.app`, no custom domain yet) on a production Supabase project, and Mercado Pago **Checkout Pro is live with sandbox (test) credentials** — however, no sandbox purchase has actually gone all the way through yet: every test order to date is stuck unpaid because the webhook was silently broken (see the 1c correction below) and production hasn't been redeployed with the fix. This roadmap covers finishing the sandbox test matrix — starting with re-confirming a real approved payment now that the fix is in — then going live with real MP credentials, hardening, and layering new capabilities on top.

This document follows `AGENTS.md`: no backward-compat layers, remove obsolete paths instead of adding fallbacks, choose the simplest implementation that fully meets the requirement, grow the system in layers on a product that already works, reuse existing dependencies/helpers, and edit `supabase/migrations/0001_init_schema.sql` in place (no patch migrations until the first shared deploy), regenerating `src/types/database.types.ts` after any schema change.

---

## Current state (what already exists — do not rebuild)

Storefront, cart (Zustand + `localStorage`), guest **and** logged-in checkout, atomic stock reservation with a 30-minute TTL + cron release, Mercado Pago Checkout Pro (redirect) with a signature-verified webhook + refund, coupons, Resend order emails, and an admin panel (product/variant/image CRUD, order status + refund, coupons, settings, read-only reports/customers), all behind layered Postgres RLS. Deployed to Vercel production with Mercado Pago running on sandbox credentials; the approved-payment flow is **not yet verified live** — a webhook bug shipped to production silently (see the 1c correction) and every test order so far is stuck unpaid, pending a redeploy + retest. `RESEND_API_KEY` and Google OAuth credentials are still unset, so order-confirmation emails and social login remain untested in prod.

Solid foundations worth preserving as-is: row-locked atomic stock reservation (`create_order_and_reserve_stock`), idempotent release (`release_order_reservation`), guest checkout via an unguessable `confirmation_token`, webhook signature verification + payment re-fetch (never trusting the webhook body), and refund with an `audit_logs` entry.

---

## Phase 0 — Going-live foundation (deploy prerequisites)

Execute the `CLAUDE.md` "Going live" checklist, in order. These block everything Mercado-Pago-live.

1. ~~Push to GitHub~~ — done: repo pushed to `github.com/N-dossantos/groundcontrol`, `origin/main` up to date.
2. ~~Create a production Supabase project~~ — done: project `groundcontrol` (`lgntsnelmqrvcqtjdwdj`) created, `0001_init_schema.sql` applied via Supabase MCP (`seed.sql` correctly skipped — 0 rows, no test admin in prod). **Found and fixed during rollout:** Supabase Cloud's provisioning role grants `EXECUTE` on new functions directly to `anon`/`authenticated` (separate from the implicit `PUBLIC` grant) — the migration's original `revoke ... from public` on the four service-role-only RPCs (`create_order_and_reserve_stock`, `release_order_reservation`, `validate_coupon`, `next_order_number`) didn't actually block them on the hosted project, only locally. Migration now explicitly revokes `from public, anon, authenticated`; verified via `information_schema.routine_privileges` that only `service_role` holds `EXECUTE` on prod. Also pinned `search_path = public` on `set_updated_at`/`next_order_number` (flagged by the security advisor). Project URL: `https://lgntsnelmqrvcqtjdwdj.supabase.co`; anon/publishable keys captured — `service_role` key is not exposed via MCP by design, grab it from the dashboard (Settings → API) when wiring up Vercel env vars.
3. ~~Set all production env vars in Vercel~~ — mostly done: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM_ADDRESS`, `CRON_SECRET`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `MP_ACCESS_TOKEN` + `MP_WEBHOOK_SECRET` (sandbox, see Phase 1a) are all set on Production + Preview. **Still missing: `RESEND_API_KEY`** — order-confirmation emails will fail (silently, since email sending is fire-and-forget) until this is added.
4. **Configure Google OAuth.** Only a disabled Apple template block exists today. Create Google Cloud OAuth credentials (authorized redirect URI = the Supabase project's `.../auth/v1/callback`), then enable + configure the Google provider in the Supabase Auth dashboard.
5. ~~Resolve `font-stat`~~ — done: swapped to Barlow Condensed Bold via `next/font/google` (Liberation Sans Narrow Bold was pulled from its upstream repo over licensing problems).
6. ~~Deploy to Vercel~~ — done: live at `https://groundcontrol90.vercel.app` (project `groundcontrol90`, no custom domain attached — the free `.vercel.app` subdomain is public HTTPS, which is all Mercado Pago requires). `NEXT_PUBLIC_SITE_URL` confirmed correctly synced by checking the live `/robots.txt` and `/sitemap.xml` output (Vercel's `env pull`/`env ls` redact values in this account, so this was the only way to verify without exposing secrets). **Still open:** no custom domain, and the Supabase Auth **Site URL** + redirect allow-list have not been synced to the `.vercel.app` domain — low priority until Google OAuth (item 4) is actually configured.
7. **Promote a real admin** (`profiles.role = 'admin'`) via the Supabase SQL editor. The local test admin is not for production.

---

## Phase 1 — Mercado Pago: get it live & tested (the "full MP plan")

The core of this request. Four sub-steps.

### 1a. Credentials & configuration (sandbox first) — ✅ done
- MP application created in the MP developer dashboard; sandbox `MP_ACCESS_TOKEN` obtained and set in Vercel (Production + Preview).
- **Correction to the note below:** Mercado Pago's dashboard no longer issues a `TEST-`-prefixed access token. Test credentials live under a separate left-sidebar section in the app — **"Pruebas" → "Credenciales de prueba"** (distinct from "Producción" → "Credenciales de producción") — and use the same `APP_USR-...` format as production. The only way to confirm a token is actually a sandbox one is to call `GET https://api.mercadopago.com/users/me` with it and check for `"tags": [..., "test_user"]` and a `test_user_...@testuser.com` email — do this before wiring any MP token in, since the two credential sets look identical at a glance and grabbing the wrong tab is an easy mistake (happened once during this rollout).
- Webhook registered at `https://groundcontrol90.vercel.app/api/webhooks/mercadopago`; `MP_WEBHOOK_SECRET` set in Vercel and confirmed live — an unsigned test `POST` to the route now returns `401 {"error":"firma_invalida"}` instead of the old "Mercado Pago no configurado" config error.
- **Public HTTPS is required:** `back_urls` + `auto_return: "approved"` (set in `src/lib/mercadopago/preference.ts`) are rejected by MP for `localhost`. Since Vercel production was already deployed (Phase 0) and carries no real traffic yet, sandbox testing ran directly against production (`https://groundcontrol90.vercel.app`) rather than a separate preview deploy — either works, the only real requirement is a public HTTPS URL.
- **Sandbox testing needs a Mercado Pago *test buyer* account, not your real MP login.** Checkout Pro's payment page uses whatever MP session is already active in the browser — if that's your real personal account, "approved"-looking test cards will attempt a **real charge on your real card**, not a simulated one. Log into the MP checkout page with a test buyer account (Developer dashboard → your app → **Pruebas → Cuentas de prueba**, auto-created alongside the app) before paying. MP also auto-loads the standard published test cards (e.g. Mastercard `5031 7557 3453 0604`) as saved payment methods on that test buyer account, so you don't need to hand-type card numbers. Cardholder-name magic values (`APRO` = approved, `OTHE` = rejected, `CONT` = pending) still apply.

### 1b. Fix the known gaps (small, targeted code changes) — ✅ done
All five items below were verified already present in the codebase (implemented in an earlier session but not checked off here):
- **Fail-fast env validation** — `getMercadoPagoConfig()` / `verifyWebhookSignature()` both throw clear "Mercado Pago no configurado" errors when `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` are unset.
- **Refund reconciliation in the webhook** — `route.ts` has an `else if (payment.status === "refunded" && order.estado !== "reembolsado")` branch that reconciles a dashboard-initiated refund.
- **`payments` row lifecycle** — `crear-preferencia/route.ts` inserts a `pendiente` `payments` row right after creating the MP preference; the webhook updates it by `order_id` first and only inserts if no row exists.
- **Result-page "not found / expired" UX** — `CheckoutResultPage.tsx` renders an explicit "No pudimos encontrar tu pedido" state with a WhatsApp fallback when the token/order lookup fails.
- **Remove obsolete paths** — confirmed `NEXT_PUBLIC_MP_PUBLIC_KEY` and `src/app/api/pedidos/confirmacion/route.ts` don't exist in the codebase.

### 1c. End-to-end sandbox test (on production, see 1a)
Verify each leg with MP test cards:

| Scenario | Expected | Status |
|---|---|---|
| Approved payment | redirect to `/checkout/exito` → webhook marks order `pagado` → confirmation email sent (`sendOrderConfirmationEmail`) | ⏸️ retest needed — see correction below |
| Rejected payment | `/checkout/error` → webhook calls `release_order_reservation` → stock + coupon usage restored | not yet run |
| Pending payment | `/checkout/pendiente` | not yet run |
| Admin total refund | `payments` + `orders` → `reembolsado`, `audit_logs` row written | ⏸️ locked on approved payment #1 |
| MP-dashboard refund | webhook `refunded` branch (1b) reconciles `orders.estado` | ⏸️ locked on approved payment #2 |
| Reservation expiry | unpaid order > 30 min → cron `/api/cron/liberar-reservas` releases it | not yet run |

**Correction — the "confirmed working" note above was wrong.** A DB check of all 12 test orders created so far (`GC90-000001`..`000012`) showed every single one stuck at `pendiente_pago`/`cancelado` with `payments.mp_payment_id` still `null` — the webhook has never actually fired, even for the run originally logged as a success (that call was judged by the MP checkout redirect succeeding, not by confirming the DB write).

**Root cause, in two parts:**
1. An uncommitted local edit had deleted the `notification_url` field from `buildPreferenceBody` (`src/lib/mercadopago/preference.ts`). Mercado Pago keeps separate webhook URLs for "Modo pruebas" vs "Modo productivo" configured in the dashboard (Your integrations → Webhooks) — only the per-preference `notification_url` reliably reaches the endpoint for sandbox/test-mode payments regardless of which dashboard mode is registered.
2. This repo is deployed via `vercel --prod` CLI runs, **not** Vercel's GitHub integration — `vercel inspect` on the live deployment shows no git commit metadata at all. A CLI deploy ships whatever is sitting in the local working tree at that moment, uncommitted changes included. So the broken (notification_url-less) file was shipped straight to production without ever being committed — `git log`/`git diff` looked totally clean the whole time, which is what made this so easy to miss. Restoring the line locally brought the file back to matching `origin/main` exactly (nothing to commit), but **production itself is still running the old broken build** — a fresh `vercel --prod` deploy is required before retesting, committing first isn't sufficient on its own since this project doesn't auto-deploy from git pushes.

**Action items before retesting:** (a) run `vercel --prod` (or equivalent) to actually ship the restored `notification_url`, (b) going forward, treat `git status` being clean as a precondition for any `vercel --prod` run on this project so a dirty working tree can never silently ship again, (c) then run a fresh sandbox purchase end-to-end and confirm in the DB (`orders.estado = 'pagado'`, `payments.mp_payment_id` populated) before trusting any row in this table — the MP checkout redirect succeeding is not sufficient evidence, as this whole incident showed.

**Prerequisite hit during testing:** the production catalog had 0 products (`seed.sql` was intentionally skipped in Phase 0), so there was nothing to add to cart. A single throwaway product was inserted directly via SQL for this — `TEST SANDBOX (borrar)`, slug `test-sandbox-borrar`, $100 ARS, talle M, stock 5. **This needs to be deleted before real customers browse the catalog** (`delete from products where slug = 'test-sandbox-borrar';`, cascades to its variant/image) — either before Phase 1d go-live, or once the rest of the 1c matrix is done with it. The 12 stuck test orders (`GC90-000001`..`000012`, none `pagado`) are harmless leftovers and can be ignored or cleaned up later — they don't block anything.

**Second bug found after the redeploy (2026-08-03):** with `notification_url` restored and shipped, the webhook started reaching the endpoint (previously it never fired at all) but every call failed signature verification — `firma_invalida` / `SignatureMismatch` from the SDK's `WebhookSignatureValidator`, meaning the HMAC we computed didn't match MP's. Confirmed via `vercel logs` (the warn line fires on every attempt) and via the DB (`GC90-000013`, `GC90-000014` both stuck `pendiente_pago`/`mp_payment_id: null` despite `status=approved` redirects). `MP_WEBHOOK_SECRET` and `MP_ACCESS_TOKEN` had both been set in Vercel 16h prior and never changed — so this had been silently broken since initial setup, layered underneath the `notification_url` bug. Re-copying the secret from **Tus integraciones → app → Webhooks → Configurar notificaciones** into Vercel and redeploying did **not** fix it — still `SignatureMismatch` on the very next test purchase (`GC90-000014`). Added a defensive `.trim()` in `verifyWebhookSignature` (`src/lib/mercadopago/webhookVerify.ts`) on the theory that Vercel's env var textarea picked up a trailing newline/whitespace on paste, silently breaking the byte-for-byte HMAC comparison — plausible but **not yet confirmed as the actual root cause**, since neither value was directly comparable (Vercel redacts sensitive env vars, and the secret was never printed). **Status: fix deployed, retest pending** — if `SignatureMismatch` persists after this, the next diagnostic step is logging `secret.length` (not the secret itself) right before `WebhookSignatureValidator.validate` to check for a length anomaly, since that would confirm/rule out whitespace without ever exposing the value.

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

- For Phase 1 code work: `npm run build` + `npm run lint` clean; `npx supabase db reset` applies cleanly and `gen types` produces no surprising diff; then run the **1c sandbox test matrix** against a public HTTPS deploy — production (`https://groundcontrol90.vercel.app`) or a preview both work (approved / rejected / pending / refund / dashboard-refund / reservation-expiry), watching Vercel function logs for webhook signature validation and the MP payment re-fetch. **Before trusting any "done" mark in that table, confirm it in the DB** (`orders.estado`, `payments.mp_payment_id`) — a redirect landing on the right result page is not proof the webhook ran; the whole 1c matrix is open again pending the redeploy described in the 1c correction.
