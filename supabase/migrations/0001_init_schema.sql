-- Ground Control 90 — schema inicial
-- Enums, tablas, funciones auxiliares y políticas RLS.

-- ============================================================
-- ENUMS
-- ============================================================

create type product_tipo as enum ('camiseta', 'short', 'conjunto');
create type user_role as enum ('admin', 'customer');

-- ============================================================
-- TABLAS
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'customer',
  nombre      text,
  apellido    text,
  telefono    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table addresses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  calle               text not null,
  numero              text,
  piso_depto          text,
  ciudad              text not null,
  provincia           text not null,
  codigo_postal       text not null,
  pais                text not null default 'Argentina',
  telefono_contacto   text,
  es_predeterminada   boolean not null default false,
  created_at          timestamptz not null default now()
);

create table products (
  id                      uuid primary key default gen_random_uuid(),
  nombre                  text not null,
  slug                    text not null unique,
  tipo                    product_tipo not null,
  club                    text,
  liga                    text,
  temporada               text,
  descripcion             text,
  -- Seteado directo por el admin; en conjuntos NO se deriva de la suma de partes.
  precio                  numeric(10, 2) not null check (precio >= 0),
  permite_personalizacion boolean not null default false,
  activo                  boolean not null default true,
  destacado               boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  alt_text    text,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

-- Un solo campo talle por variante (también para conjuntos: ver decisión de producto).
create table product_variants (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  talle         text not null,
  sku           text not null unique,
  stock         int not null default 0 check (stock >= 0),
  stock_minimo  int not null default 3,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (product_id, talle)
);

create table coupons (
  id                  uuid primary key default gen_random_uuid(),
  codigo              text not null unique,
  tipo                text not null check (tipo in ('porcentaje', 'monto_fijo')),
  valor               numeric(10, 2) not null,
  fecha_inicio        timestamptz,
  fecha_fin           timestamptz,
  usos_maximos        int,
  usos_actuales       int not null default 0,
  monto_minimo_compra numeric(10, 2) not null default 0,
  activo              boolean not null default true,
  created_at          timestamptz not null default now()
);

-- Fuente única editable por el admin: costo de envío, número de WhatsApp, punto de encuentro.
create table app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references profiles(id)
);

create table orders (
  id                   uuid primary key default gen_random_uuid(),
  order_number         text not null unique,
  -- Lookup firmado para que un invitado pueda ver la confirmación de su propio pedido.
  confirmation_token   uuid not null default gen_random_uuid(),
  user_id              uuid references profiles(id) on delete set null,
  guest_email          text,
  guest_phone          text,
  estado               text not null default 'pendiente_pago'
                        check (estado in (
                          'pendiente_pago', 'pagado', 'en_preparacion',
                          'enviado', 'entregado', 'cancelado', 'reembolsado'
                        )),
  metodo_entrega       text not null
                        check (metodo_entrega in ('retiro_punto_encuentro', 'envio_domicilio')),
  -- Snapshot inmutable, no FK: preserva el historial aunque el cliente edite direcciones después.
  direccion_envio      jsonb,
  costo_envio          numeric(10, 2) not null default 0,
  subtotal             numeric(10, 2) not null,
  descuento            numeric(10, 2) not null default 0,
  total                numeric(10, 2) not null,
  moneda               text not null default 'ARS',
  coupon_id            uuid references coupons(id),
  notas                text,
  mp_preference_id     text,
  -- TTL de la reserva de stock/cupón (ver create_order_and_reserve_stock).
  reserva_expira_at    timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint chk_owner check (user_id is not null or guest_email is not null)
);

create table order_items (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references orders(id) on delete cascade,
  product_variant_id       uuid not null references product_variants(id),
  -- Snapshot: si el producto se edita después, no reescribe el historial del pedido.
  product_nombre_snapshot  text not null,
  talle_snapshot           text not null,
  precio_unitario          numeric(10, 2) not null,
  cantidad                 int not null check (cantidad > 0),
  -- Personalización por ítem (no por producto).
  nombre_estampado         text,
  numero_estampado         text,
  subtotal_item            numeric(10, 2) not null,
  created_at               timestamptz not null default now()
);

-- Solo referencias de Mercado Pago, nunca datos de tarjeta.
create table payments (
  id                     uuid primary key default gen_random_uuid(),
  order_id               uuid not null references orders(id) on delete cascade,
  proveedor              text not null default 'mercado_pago',
  mp_payment_id          text unique,
  mp_preference_id       text,
  mp_merchant_order_id   text,
  estado                 text not null
                          check (estado in (
                            'pendiente', 'aprobado', 'rechazado',
                            'en_proceso', 'reembolsado', 'cancelado'
                          )),
  monto                  numeric(10, 2) not null,
  moneda                 text not null default 'ARS',
  raw_webhook_payload    jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references profiles(id),
  accion      text not null,
  entidad     text not null,
  entidad_id  uuid not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index idx_products_tipo_activo on products(tipo, activo);
create index idx_products_club on products(club);
create index idx_product_variants_product_id on product_variants(product_id);
create index idx_product_images_product_id on product_images(product_id);
create index idx_orders_user_id on orders(user_id);
create index idx_orders_guest_email on orders(guest_email);
create index idx_orders_estado on orders(estado);
create index idx_order_items_order_id on order_items(order_id);
create index idx_payments_order_id on payments(order_id);
create index idx_addresses_user_id on addresses(user_id);

-- ============================================================
-- FUNCIONES AUXILIARES (SECURITY DEFINER, alcance acotado)
-- ============================================================

create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, nombre)
  values (
    new.id,
    'customer',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on profiles
  for each row execute function set_updated_at();
create trigger set_updated_at_products before update on products
  for each row execute function set_updated_at();
create trigger set_updated_at_product_variants before update on product_variants
  for each row execute function set_updated_at();
create trigger set_updated_at_orders before update on orders
  for each row execute function set_updated_at();
create trigger set_updated_at_payments before update on payments
  for each row execute function set_updated_at();

-- Genera el próximo número de orden legible (GC90-000123) de forma segura ante concurrencia.
create sequence order_number_seq start 1;

create function next_order_number()
returns text
language sql
set search_path = public
as $$
  select 'GC90-' || lpad(nextval('order_number_seq')::text, 6, '0');
$$;

-- Valida un cupón sin exponer la tabla completa (evita enumeración de códigos).
create function validate_coupon(p_codigo text, p_subtotal numeric)
returns table (
  valido boolean,
  motivo text,
  coupon_id uuid,
  descuento numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_coupon coupons%rowtype;
begin
  select * into v_coupon from coupons where codigo = p_codigo and activo = true;

  if not found then
    return query select false, 'cupon_no_encontrado', null::uuid, 0::numeric;
    return;
  end if;

  if v_coupon.fecha_inicio is not null and now() < v_coupon.fecha_inicio then
    return query select false, 'cupon_no_vigente', null::uuid, 0::numeric;
    return;
  end if;

  if v_coupon.fecha_fin is not null and now() > v_coupon.fecha_fin then
    return query select false, 'cupon_vencido', null::uuid, 0::numeric;
    return;
  end if;

  if v_coupon.usos_maximos is not null and v_coupon.usos_actuales >= v_coupon.usos_maximos then
    return query select false, 'cupon_agotado', null::uuid, 0::numeric;
    return;
  end if;

  if p_subtotal < v_coupon.monto_minimo_compra then
    return query select false, 'monto_minimo_no_alcanzado', null::uuid, 0::numeric;
    return;
  end if;

  if v_coupon.tipo = 'porcentaje' then
    return query select true, null::text, v_coupon.id, round(p_subtotal * v_coupon.valor / 100, 2);
  else
    return query select true, null::text, v_coupon.id, least(v_coupon.valor, p_subtotal);
  end if;
end;
$$;

-- Reserva stock de forma atómica al crear la orden (antes de redirigir a Mercado Pago),
-- cerrando la ventana de sobreventa propia del flujo de Checkout Pro (redirect-away).
-- p_items: jsonb[] de { product_variant_id, cantidad, nombre_estampado, numero_estampado }
create function create_order_and_reserve_stock(
  p_user_id uuid,
  p_guest_email text,
  p_guest_phone text,
  p_metodo_entrega text,
  p_direccion_envio jsonb,
  p_costo_envio numeric,
  p_items jsonb,
  p_coupon_codigo text default null
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_variant product_variants%rowtype;
  v_product products%rowtype;
  v_subtotal numeric := 0;
  v_descuento numeric := 0;
  v_coupon_id uuid := null;
  v_order orders%rowtype;
  v_precio_unitario numeric;
  v_subtotal_item numeric;
  v_coupon_valido boolean;
  v_coupon_motivo text;
  v_coupon_descuento numeric;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'carrito_vacio';
  end if;

  -- Bloquea cada variante afectada (orden estable por id para evitar deadlocks) y valida stock.
  for v_item in
    select * from jsonb_array_elements(p_items) order by (value ->> 'product_variant_id')
  loop
    select * into v_variant
    from product_variants
    where id = (v_item ->> 'product_variant_id')::uuid
    for update;

    if not found then
      raise exception 'variante_no_encontrada: %', (v_item ->> 'product_variant_id');
    end if;

    if v_variant.stock < (v_item ->> 'cantidad')::int then
      raise exception 'sin_stock: %', v_variant.sku;
    end if;

    select * into v_product from products where id = v_variant.product_id;

    v_precio_unitario := v_product.precio;
    v_subtotal_item := v_precio_unitario * (v_item ->> 'cantidad')::int;
    v_subtotal := v_subtotal + v_subtotal_item;
  end loop;

  if p_coupon_codigo is not null then
    select valido, motivo, coupon_id, descuento
      into v_coupon_valido, v_coupon_motivo, v_coupon_id, v_coupon_descuento
      from validate_coupon(p_coupon_codigo, v_subtotal);

    if not v_coupon_valido then
      raise exception 'cupon_invalido: %', v_coupon_motivo;
    end if;

    v_descuento := v_coupon_descuento;
  end if;

  insert into orders (
    order_number, user_id, guest_email, guest_phone, estado, metodo_entrega,
    direccion_envio, costo_envio, subtotal, descuento, total, coupon_id, reserva_expira_at
  ) values (
    next_order_number(), p_user_id, p_guest_email, p_guest_phone, 'pendiente_pago', p_metodo_entrega,
    p_direccion_envio, p_costo_envio, v_subtotal, v_descuento,
    v_subtotal + p_costo_envio - v_descuento, v_coupon_id, now() + interval '30 minutes'
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_variant from product_variants where id = (v_item ->> 'product_variant_id')::uuid;
    select * into v_product from products where id = v_variant.product_id;

    update product_variants
      set stock = stock - (v_item ->> 'cantidad')::int
      where id = v_variant.id;

    insert into order_items (
      order_id, product_variant_id, product_nombre_snapshot, talle_snapshot,
      precio_unitario, cantidad, nombre_estampado, numero_estampado, subtotal_item
    ) values (
      v_order.id, v_variant.id, v_product.nombre, v_variant.talle,
      v_product.precio, (v_item ->> 'cantidad')::int,
      v_item ->> 'nombre_estampado', v_item ->> 'numero_estampado',
      v_product.precio * (v_item ->> 'cantidad')::int
    );
  end loop;

  if v_coupon_id is not null then
    update coupons set usos_actuales = usos_actuales + 1 where id = v_coupon_id;
  end if;

  return v_order;
end;
$$;

-- Reversa la reserva de stock/cupón. Idempotente: solo actúa si la orden sigue pendiente_pago,
-- así reintentos de webhook o ejecuciones repetidas del cron no la liberan dos veces.
create function release_order_reservation(p_order_id uuid, p_nuevo_estado text default 'cancelado')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_item order_items%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;

  if not found or v_order.estado <> 'pendiente_pago' then
    return;
  end if;

  for v_item in select * from order_items where order_id = p_order_id
  loop
    update product_variants
      set stock = stock + v_item.cantidad
      where id = v_item.product_variant_id;
  end loop;

  if v_order.coupon_id is not null then
    update coupons set usos_actuales = greatest(usos_actuales - 1, 0) where id = v_order.coupon_id;
  end if;

  update orders set estado = p_nuevo_estado where id = p_order_id;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table addresses enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table coupons enable row level security;
alter table app_settings enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table audit_logs enable row level security;

-- profiles
create policy "profiles_select_own" on profiles for select
  using (id = auth.uid());
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy "profiles_select_admin" on profiles for select
  using (is_admin());

-- addresses
create policy "addresses_all_own" on addresses for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "addresses_select_admin" on addresses for select
  using (is_admin());

-- products / product_images / product_variants (catálogo público de solo lectura)
create policy "products_select_public" on products for select
  using (activo = true);
create policy "products_all_admin" on products for all
  using (is_admin())
  with check (is_admin());

create policy "product_images_select_public" on product_images for select
  using (exists (select 1 from products p where p.id = product_id and p.activo = true));
create policy "product_images_all_admin" on product_images for all
  using (is_admin())
  with check (is_admin());

create policy "product_variants_select_public" on product_variants for select
  using (exists (select 1 from products p where p.id = product_id and p.activo = true));
create policy "product_variants_all_admin" on product_variants for all
  using (is_admin())
  with check (is_admin());

-- coupons: sin policy pública — validación solo vía validate_coupon()
create policy "coupons_all_admin" on coupons for all
  using (is_admin())
  with check (is_admin());

-- app_settings
create policy "app_settings_select_public" on app_settings for select
  using (true);
create policy "app_settings_all_admin" on app_settings for all
  using (is_admin())
  with check (is_admin());

-- orders: sin insert/update/delete de clientes — todo pasa por funciones SECURITY DEFINER
-- o rutas server con service-role key.
create policy "orders_select_own" on orders for select
  using (user_id = auth.uid());
create policy "orders_all_admin" on orders for all
  using (is_admin())
  with check (is_admin());

-- order_items
create policy "order_items_select_own" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_items_all_admin" on order_items for all
  using (is_admin())
  with check (is_admin());

-- payments: sin acceso de clientes en absoluto
create policy "payments_select_admin" on payments for select
  using (is_admin());

-- audit_logs
create policy "audit_logs_select_admin" on audit_logs for select
  using (is_admin());

-- ============================================================
-- STORAGE
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_bucket_select_public" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product_images_bucket_write_admin" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());
create policy "product_images_bucket_update_admin" on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());
create policy "product_images_bucket_delete_admin" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ============================================================
-- GRANTS
-- ============================================================
-- RLS hace el control de acceso fila a fila; a nivel de tabla se conceden
-- privilegios amplios a anon/authenticated (igual que el template estándar
-- de Supabase) — sin esto, Postgres rechaza la consulta con "permission
-- denied" antes de siquiera evaluar las policies.

grant usage on schema public to anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

-- is_admin() se invoca dentro de las policies de RLS para cualquier rol, así
-- que anon/authenticated necesitan poder ejecutarla aunque sea SECURITY DEFINER.
grant execute on function is_admin() to anon, authenticated;

-- Postgres otorga EXECUTE a PUBLIC por defecto en toda función nueva, y en
-- Supabase Cloud el rol de aprovisionamiento además concede EXECUTE directo a
-- anon/authenticated vía default privileges (revocar solo de PUBLIC no alcanza
-- para bloquearlos). Sin ambos revokes, anon podría invocar por RPC estas
-- funciones de negocio directamente (ej. crear pedidos "fantasma" para retener
-- stock, o cancelar la reserva de cualquier orden por id). Quedan alcanzables
-- SOLO por rutas server con la service_role key.
revoke execute on function create_order_and_reserve_stock(
  uuid, text, text, text, jsonb, numeric, jsonb, text
) from public, anon, authenticated;
revoke execute on function release_order_reservation(uuid, text) from public, anon, authenticated;
revoke execute on function validate_coupon(text, numeric) from public, anon, authenticated;
revoke execute on function next_order_number() from public, anon, authenticated;
grant execute on function create_order_and_reserve_stock(
  uuid, text, text, text, jsonb, numeric, jsonb, text
) to service_role;
grant execute on function release_order_reservation(uuid, text) to service_role;
grant execute on function validate_coupon(text, numeric) to service_role;
grant execute on function next_order_number() to service_role;
