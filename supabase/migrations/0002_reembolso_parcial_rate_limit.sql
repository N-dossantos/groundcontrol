-- Ground Control 90 — reembolsos parciales + rate limiting de endpoints públicos.

-- ============================================================
-- REEMBOLSOS PARCIALES
-- ============================================================

alter table orders drop constraint orders_estado_check;
alter table orders add constraint orders_estado_check
  check (estado in (
    'pendiente_pago', 'pagado', 'en_preparacion',
    'enviado', 'entregado', 'cancelado', 'reembolsado',
    'reembolsado_parcial'
  ));

alter table payments drop constraint payments_estado_check;
alter table payments add constraint payments_estado_check
  check (estado in (
    'pendiente', 'aprobado', 'rechazado',
    'en_proceso', 'reembolsado', 'cancelado',
    'reembolsado_parcial'
  ));

-- Suma acumulada reembolsada sobre `monto` (reembolsos parciales pueden repetirse).
alter table payments
  add column monto_reembolsado numeric(10, 2) not null default 0;

-- ============================================================
-- RATE LIMITING
-- ============================================================

-- Ventana fija de rate limiting para endpoints públicos sensibles (cupones,
-- creación de preferencia de checkout). Solo accesible vía check_rate_limit().
create table rate_limits (
  clave           text primary key,
  intentos        int not null default 1,
  ventana_inicio  timestamptz not null default now()
);

-- Ventana fija atómica: bloquea la fila de `p_clave` (creándola si hace falta)
-- para serializar solicitudes concurrentes con la misma clave, y devuelve
-- false una vez agotados los intentos dentro de la ventana.
create function check_rate_limit(p_clave text, p_max_intentos int, p_ventana_segundos int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row rate_limits%rowtype;
begin
  insert into rate_limits (clave, intentos, ventana_inicio)
  values (p_clave, 1, now())
  on conflict (clave) do nothing;

  select * into v_row from rate_limits where clave = p_clave for update;

  if now() - v_row.ventana_inicio > (p_ventana_segundos || ' seconds')::interval then
    update rate_limits set intentos = 1, ventana_inicio = now() where clave = p_clave;
    return true;
  end if;

  if v_row.intentos >= p_max_intentos then
    return false;
  end if;

  update rate_limits set intentos = intentos + 1 where clave = p_clave;
  return true;
end;
$$;

-- rate_limits: ninguna policy — RLS deniega todo a anon/authenticated por
-- defecto; solo check_rate_limit() (SECURITY DEFINER) y service_role la tocan.
alter table rate_limits enable row level security;

-- ============================================================
-- GRANTS
-- ============================================================
-- Mismo patrón que el resto de las tablas: privilegios de tabla amplios a
-- anon/authenticated (RLS arriba deniega todo), ya que Postgres rechaza la
-- query con "permission denied" antes de evaluar policies si no se
-- restablecen estos grants para una tabla nueva.

grant select, insert, update, delete on rate_limits to anon, authenticated;

-- Mismo tratamiento que las otras RPCs de negocio en 0001: Postgres otorga
-- EXECUTE a PUBLIC por default y Supabase Cloud además lo concede directo a
-- anon/authenticated, así que hay que revocar de los tres. Solo las rutas
-- server con la service_role key pueden llamarla.
revoke execute on function check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int, int) to service_role;
