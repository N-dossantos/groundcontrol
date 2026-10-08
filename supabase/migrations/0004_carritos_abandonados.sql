-- Ground Control 90 — recuperación de carrito abandonado (solo usuarios logueados).
-- El carrito invitado sigue siendo localStorage-only: sin sesión no hay email
-- conocido antes de que arranque el checkout (ahí ya existe el flujo de
-- reserva-de-stock con TTL de 30 min, un caso distinto). Esta tabla es un
-- espejo server-side del carrito Zustand de un usuario logueado, escrito por
-- el propio cliente (mismo patrón que wishlists: tabla separada, RLS
-- enteramente propia, admin solo lee) — se usa únicamente para que el cron
-- pueda detectar inactividad y disparar el email de recordatorio.

create table carts (
  user_id           uuid primary key references profiles(id) on delete cascade,
  items             jsonb not null default '[]'::jsonb,
  updated_at        timestamptz not null default now(),
  -- null = todavía no se mandó recordatorio para la inactividad actual;
  -- se resetea a null cada vez que el cliente sincroniza una actividad nueva.
  reminder_sent_at  timestamptz
);

create trigger set_updated_at_carts before update on carts
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table carts enable row level security;

-- carts: enteramente privado por cliente, el admin solo lee (mismo patrón que wishlists).
create policy "carts_all_own" on carts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "carts_select_admin" on carts for select
  using (is_admin());

-- ============================================================
-- GRANTS
-- ============================================================
-- Mismo patrón que el resto de las tablas: privilegios de tabla amplios a
-- anon/authenticated (RLS arriba deniega todo salvo el propio usuario/admin).

grant select, insert, update, delete on carts to anon, authenticated;
