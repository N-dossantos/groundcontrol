-- Ground Control 90 — costos de producción y proveedor (reemplaza la planilla Excel).
-- Tablas separadas de product_variants/order_items a propósito: las consultas
-- públicas/de cliente de este proyecto usan selects con wildcard
-- (PRODUCT_SELECT incluye product_variants(*); order_items(*) se embebe en
-- src/lib/orders.ts y cuenta/pedidos/[order_number]/page.tsx) contra tablas
-- que ya tienen policies de SELECT público/propio, y RLS de Postgres no tiene
-- granularidad por columna — cualquier columna de costo/margen agregada
-- directamente a esas tablas se filtraría por esas mismas queries sin
-- importar qué renderice la UI. Mismo patrón que coupons/rate_limits/audit_logs:
-- tabla separada, solo policy admin-only, sin policy pública.

-- ============================================================
-- TABLAS
-- ============================================================

-- Costo/proveedor "vivo": se revisa seguido (inflación), por eso costo es
-- nullable — null significa "todavía no cargado", nunca default 0.
create table product_variant_costos (
  variant_id              uuid primary key references product_variants(id) on delete cascade,
  costo                   numeric(10, 2),
  proveedor               text,
  estado_produccion       text check (estado_produccion in ('pedido', 'en_produccion', 'recibido')),
  fecha_llegada_estimada  date,
  cantidad_comprada       int,
  updated_at              timestamptz not null default now()
);

-- Snapshot inmutable del costo al momento de la venta (no un join de
-- conveniencia): con la inflación argentina, costo se revisa seguido, así que
-- el reporte de margen histórico necesita el costo vigente al vender, no el
-- costo de hoy. Poblada dentro de create_order_and_reserve_stock.
create table order_item_costos (
  order_item_id  uuid primary key references order_items(id) on delete cascade,
  costo_unitario numeric(10, 2),
  created_at     timestamptz not null default now()
);

create trigger set_updated_at_product_variant_costos before update on product_variant_costos
  for each row execute function set_updated_at();

-- ============================================================
-- create_order_and_reserve_stock: agrega el snapshot de costo por ítem
-- ============================================================

create or replace function create_order_and_reserve_stock(
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
  v_order_item_id uuid;
  v_costo_unitario numeric;
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
    ) returning id into v_order_item_id;

    select costo into v_costo_unitario
      from product_variant_costos where variant_id = v_variant.id;

    insert into order_item_costos (order_item_id, costo_unitario)
    values (v_order_item_id, v_costo_unitario);
  end loop;

  if v_coupon_id is not null then
    update coupons set usos_actuales = usos_actuales + 1 where id = v_coupon_id;
  end if;

  return v_order;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table product_variant_costos enable row level security;
alter table order_item_costos enable row level security;

create policy "product_variant_costos_all_admin" on product_variant_costos for all
  using (is_admin())
  with check (is_admin());
create policy "order_item_costos_all_admin" on order_item_costos for all
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- GRANTS
-- ============================================================
-- Mismo patrón que el resto de las tablas: privilegios de tabla amplios a
-- anon/authenticated (RLS arriba deniega todo salvo admin), ya que Postgres
-- rechaza la query con "permission denied" antes de evaluar policies si no
-- se restablecen estos grants para una tabla nueva.

grant select, insert, update, delete on product_variant_costos to anon, authenticated;
grant select, insert, update, delete on order_item_costos to anon, authenticated;

-- create_order_and_reserve_stock ya estaba revocada de public/anon/authenticated
-- y otorgada solo a service_role en 0001; el create or replace de arriba
-- preserva esa ACL (no vuelve a otorgar EXECUTE por default), pero se
-- restablece explícitamente para no depender de ese comportamiento implícito.
revoke execute on function create_order_and_reserve_stock(
  uuid, text, text, text, jsonb, numeric, jsonb, text
) from public, anon, authenticated;
grant execute on function create_order_and_reserve_stock(
  uuid, text, text, text, jsonb, numeric, jsonb, text
) to service_role;
