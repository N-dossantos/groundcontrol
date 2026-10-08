# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## This is Next.js 16 — not the Next.js in your training data

Before writing any routing/config code, check `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`. The most important breaking changes for this repo:

- **`middleware.ts` is dead — use `src/proxy.ts`, export `proxy`, not `middleware`.** It always runs on the Node.js runtime (no edge option). See `src/proxy.ts` for the pattern (session refresh + route gating for `/cuenta` and `/admin`).
- **`params` and `searchParams` are always `Promise`s** in `page.tsx`, `layout.tsx`, and route handler contexts — `await` them, no sync fallback exists anymore.
- **Tailwind v4**: there is no `tailwind.config.ts`. Brand tokens (colors, fonts, the chrome/silver gradient utility) live in `@theme` blocks in `src/app/globals.css`.
- Turbopack is the default for `dev` and `build` — no `--turbopack` flag needed.
- `next.config.ts` sets `images.remotePatterns` dynamically from `NEXT_PUBLIC_SUPABASE_URL` (Storage-hosted product images) and pins `turbopack.root` to this directory (the parent folder has an unrelated stray `package-lock.json` that otherwise confuses workspace-root detection).

## Commands

```bash
npm run dev       # start dev server (Turbopack)
npm run build     # production build
npm run start     # run a production build
npm run lint      # eslint (flat config in eslint.config.mjs)
```

### Local Supabase (required for the app to do anything — auth, catalog, orders all depend on it)

```bash
npx supabase start                       # boots local Postgres/Auth/Storage in Docker; prints local URL + anon/service keys
npx supabase db reset                    # reapplies supabase/migrations/*.sql + supabase/seed.sql from scratch
npx supabase gen types typescript --local > src/types/database.types.ts   # after any schema change
npx supabase stop                        # tear down
```

Docker must be running first. `.env.local` must point at the local instance's URL/keys (`supabase start` prints them). The schema — tables, RLS policies, `SECURITY DEFINER` functions — lives in `supabase/migrations/` (`0001_init_schema.sql` plus numbered follow-ups). Production has these applied and tracked by the Supabase CLI, so never edit an applied migration in place: every schema change is a new migration file. Generate types with the same CLI version that produced the committed file (currently `npx supabase@2.115.0`; newer CLIs emit a different, unformatted layout that rewrites the whole file).

There is no test suite in this repo currently.

## Architecture

### Supabase client layering — pick the right one

Four separate client constructors exist under `src/lib/supabase/`, each for a distinct trust boundary. Using the wrong one either breaks RLS assumptions or breaks static rendering:

- **`public.ts`** (`createPublicClient`) — anon key, no cookies. Use for public catalog reads (`src/lib/products.ts`, `src/lib/settings.ts`) that must stay statically generated/ISR'd. Calling the cookie-bound server client here would force the whole route to render dynamically.
- **`server.ts`** (`createClient`, async) — anon key + cookies via `next/headers`. Use in Server Components/Route Handlers that need the caller's session (RLS-scoped reads/writes as that user).
- **`client.ts`** (`createClient`) — browser client for Client Components (forms, admin CRUD widgets).
- **`admin.ts`** (`createAdminClient`) — service-role key, bypasses RLS entirely. Reserved for: the Mercado Pago webhook, the refund route, the checkout-preference route (calls the stock-reservation RPC), the cron reservation-release route, and guest order lookups by confirmation token. Never import this into anything client-reachable.

### Authorization model

`src/proxy.ts` gates `/cuenta/**` and `/admin/**`: no session → redirect to `/login`; `/admin/**` additionally checks `profiles.role === 'admin'`. This is a UX-layer redirect, not the security boundary — the real boundary is Postgres RLS (see below), so server code should never skip auth checks just because proxy already redirected.

RLS design in the migration is deliberately layered:
1. Table-level RLS policies (customers read/write only their own rows; `is_admin()` — a `SECURITY DEFINER` helper — grants admins broad read/write).
2. Postgres grants `EXECUTE` to `PUBLIC` on new functions by default, and RLS alone doesn't block a table without an explicit grant — both had to be handled explicitly in the migration (see the `GRANTS` section at the bottom of `0001_init_schema.sql`). If you add a new `SECURITY DEFINER` function that shouldn't be client-callable, you must `revoke ... from public, anon, authenticated` explicitly (Supabase Cloud also grants `EXECUTE` directly to `anon`/`authenticated`, so revoking from `public` alone isn't enough).
3. Business-mutation RPCs (`create_order_and_reserve_stock`, `release_order_reservation`, `validate_coupon`) are revoked from `anon`/`authenticated` entirely — only the service-role admin client can call them, from trusted API routes. This is intentional defense-in-depth, not an oversight: it forces every order/coupon mutation through our own validated route handlers.

### Order lifecycle & stock reservation

`create_order_and_reserve_stock` (called from `POST /api/checkout/crear-preferencia`) is the only way an order is created: it row-locks (`FOR UPDATE`) every affected `product_variants` row, validates stock, decrements it, and inserts `orders`/`order_items` atomically — all *before* redirecting to Mercado Pago's Checkout Pro page. `orders.reserva_expira_at` gives a 30-minute TTL; `POST /api/cron/liberar-reservas` (called every 10 minutes by a GitHub Actions scheduled workflow, `.github/workflows/liberar-reservas.yml` — Vercel's Hobby plan only allows daily cron jobs, too coarse for a 30-minute TTL) and the Mercado Pago webhook (on rejected/cancelled payments) both call `release_order_reservation`, which is idempotent — it only acts if the order is still `pendiente_pago`, so replayed webhooks or concurrent cron runs can't double-release. If the Mercado Pago API call itself fails after the order/reservation was created, the checkout route releases the reservation in its `catch` block rather than leaving stock stuck.

Order status values (`orders.estado`, `payments.estado`) are `text` + `CHECK` constraints, not Postgres enums — deliberately, so new statuses don't require `ALTER TYPE` migrations. `product_tipo` (`camiseta | short | conjunto`) and `profiles.role` *are* real enums since those categories are stable.

Guest checkout is fully supported: `orders.user_id` is nullable, guest contact lives in `orders.guest_email`/`guest_phone`, and a guest's own order is reachable post-checkout only via the `orders.confirmation_token` UUID embedded in the Mercado Pago `back_urls` (see `src/lib/orders.ts` → `getOrderByConfirmationToken`, used by `/checkout/exito|pendiente|error`) — never via RLS, since guest rows match no `auth.uid()`.

### Mercado Pago integration

Checkout Pro only (redirect flow), not the embedded Bricks/Checkout API — see `src/lib/mercadopago/`. Preference creation, payment lookup, and refunds all go through the official `mercadopago` SDK's class-based clients (`Preference`, `Payment`, `PaymentRefund`), constructed via `getMercadoPagoConfig()`. The webhook route (`/api/webhooks/mercadopago`) validates signatures with the SDK's own `WebhookSignatureValidator` and always re-fetches the payment from the Mercado Pago API rather than trusting the webhook body. The admin refund route (`/api/admin/pedidos/[id]/reembolsar`) double-checks the caller's admin role via the session-bound client before doing anything privileged with the admin client.

### Cart

Client-only state (Zustand + `persist` to `localStorage`), not a DB table — see `src/lib/cart/store.ts`. Because the store hydrates from `localStorage` after mount, any component that reads it for first-paint-sensitive UI (cart badge count, cart page, checkout summary) must gate on `useHydrated()` (`src/lib/hooks/useHydrated.ts`, a `useSyncExternalStore`-based check) instead of an `useEffect` + `setState` mount flag — the latter trips the `react-hooks/set-state-in-effect` lint rule and causes an extra render.

The slide-out cart drawer (`src/components/cart/CartDrawer.tsx`) shares this same store: its open/close state is `isOpen` (`openCart`/`closeCart`/`toggleCart`), and `addItem` sets `isOpen: true` so adding a product pops the drawer open. `partialize` persists **only `items`** — `isOpen` is deliberately excluded, so a page reload never restores an open drawer.

### Route structure

- `src/app/(site)/**` — public storefront, wrapped by `(site)/layout.tsx` (Header/Footer, fetches `app_settings` for the WhatsApp number and pickup-point copy — editable from `/admin/configuracion` without a redeploy).
- `src/app/admin/**` — role-gated admin panel, own layout/nav, no relation to the public site chrome.
- `src/app/api/**` — all the privileged mutation endpoints described above.
- Pages needing DB access for SSG use `src/lib/products.ts` / `src/lib/settings.ts` (the public client) so `generateStaticParams`/ISR keep working; anything under `/cuenta` or `/admin` is inherently dynamic (session-dependent) and uses the server client directly in the page.
- Catalog filtering **and** search funnel through one function: `getProducts(filters)` reads `tipo`/`club`/`talle`/`precioMin`/`precioMax`/`q` off `/catalogo`'s `searchParams`. Search has no dedicated endpoint or full-text index — `HeaderSearch` (`src/components/layout/HeaderSearch.tsx`) just pushes to `/catalogo?q=…`, and `q` becomes a case-insensitive `ilike` on `products.nombre`. (`talle` is the one filter applied in JS after the query, since it lives on the joined variants.)

### Brand design tokens

Colors/fonts are defined once in `src/app/globals.css` (`@theme` block) as `gc-negro`, `gc-blanco`, `gc-carbon`, `gc-celeste` (reserved for Selección Argentina/Mundial content only — not general UI), `gc-dorado` (achievement/urgency accents), and the `bg-gradient-cromo`/`text-gradient-cromo` utilities for the chrome/silver isologo look. `font-headline` (Poppins ExtraBold, uppercase), `font-body` (Lato), `font-stat` (Barlow Condensed Bold — swapped in for the brand kit's Liberation Sans Narrow Bold, which was pulled from its upstream repo over licensing problems).

## Going live — what's still missing

The app is fully built and verified against **local** Docker Supabase only. Nothing has been pushed to GitHub or deployed. To put the real site on the web, work through these in order:

1. **Push to GitHub.** `git remote -v` currently shows nothing — only the original `create-next-app` commit exists, everything since (all app code) is uncommitted/untracked. Create a GitHub repo and push before connecting Vercel (Vercel deploys from a git repo, not a local folder).
2. **Create a production Supabase project** (Supabase Cloud, not local Docker). Then:
   - Run `supabase link --project-ref <ref>` and `supabase db push` to apply `supabase/migrations/0001_init_schema.sql` to it.
   - Run `supabase/seed.sql` only if you actually want the seeded demo data in production (probably not — it includes the test admin account below).
   - In the Supabase dashboard, grab the project URL, `anon` key, and `service_role` key for the env vars below.
3. **Set all production env vars** (in Vercel's dashboard, not a committed file — see `.env.local.example` for the full list):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from step 2.
   - `NEXT_PUBLIC_SITE_URL` — the real domain (currently `http://localhost:3000`).
   - `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` — **empty even locally**, never tested live. Create a Mercado Pago application (sandbox first, then production credentials) at the MP developer dashboard, and register the webhook URL (`https://<domain>/api/webhooks/mercadopago`) so `MP_WEBHOOK_SECRET` has something to validate against.
   - `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` — sign up for Resend, verify the sending domain (`groundcontrol90.com` per the default `EMAIL_FROM_ADDRESS`), get an API key.
   - `CRON_SECRET` — any random secret; must match the same value set as a `CRON_SECRET` GitHub Actions repo secret (used by `.github/workflows/liberar-reservas.yml` to call `/api/cron/liberar-reservas`).
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — replace the placeholder `5491100000000` with the real business number (or seed `app_settings.whatsapp_numero` instead, which takes priority).
4. **Google OAuth login.** Only Apple's provider block exists (disabled, template default) in `supabase/config.toml` — Google was never actually configured. Create OAuth credentials in Google Cloud Console (authorized redirect URI = the Supabase project's `.../auth/v1/callback`), then enable + configure the Google provider in the Supabase Auth dashboard (production project, and locally in `supabase/config.toml` under `[auth.external.google]` if you want to test it locally too).
5. ~~Liberation Sans Narrow Bold font files~~ — resolved: `font-stat` now uses Barlow Condensed Bold via `next/font/google` (see `src/app/layout.tsx`), since Liberation Sans Narrow was pulled from its upstream repo over licensing problems and isn't safe to bundle.
6. **Deploy to Vercel**: import the GitHub repo, paste in the env vars from step 3, deploy. The stock-reservation release cron runs via GitHub Actions (`.github/workflows/liberar-reservas.yml`, every 10 min), not Vercel Cron — set `SITE_URL` and `CRON_SECRET` as GitHub repo secrets (Settings → Secrets and variables → Actions) for it to work. **Its `schedule:` trigger is currently commented out** (the site isn't live, so the runs only failed) — uncomment it as part of this step, or abandoned checkouts will hold their stock reservation forever.
7. **Custom domain** (if not using the default `*.vercel.app` URL): add it in Vercel, update DNS, then update `NEXT_PUBLIC_SITE_URL` and the Supabase Auth **Site URL**/redirect allow-list (currently `http://127.0.0.1:3000` locally) to match — stale redirect URLs silently break OAuth and email-confirmation links.
8. **Promote a real admin.** The only admin account (`nicotest@groundcontrol90.dev`) was hand-promoted in the local DB for testing — not meant for production. Sign up normally on the live site, then flip `profiles.role` to `'admin'` for the real account via the Supabase dashboard's SQL editor.
