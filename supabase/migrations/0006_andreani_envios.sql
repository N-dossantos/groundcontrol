-- Ground Control 90 — integración Andreani (cotización + envío + tracking).
-- Dos columnas nuevas en `orders`, no una tabla separada: es un valor único
-- por pedido (no una relación uno-a-muchos como product_variant_costos/
-- order_item_costos en 0005), y el número de seguimiento es de cara al
-- cliente por naturaleza — no hay problema de privacidad RLS que justifique
-- separarlo.
--
-- `guest_nombre` también se agrega acá: crear una orden de envío en Andreani
-- requiere el nombre completo del destinatario (remitente/destinatario en el
-- body de la API), y hoy ese dato no se persiste para checkout de invitado
-- (solo guest_email/guest_phone) — para un usuario logueado ya está en
-- profiles.nombre/apellido.

alter table orders
  add column andreani_numero_envio text,
  add column andreani_envio_creado_at timestamptz,
  add column guest_nombre text;

-- ============================================================
-- create_order_and_reserve_stock: agrega p_guest_nombre
-- ============================================================
-- Cambia la firma (nuevo parámetro en el medio, para mantener p_coupon_codigo
-- al final con su default), así que `create or replace` no alcanza para
-- reemplazar la versión de 0001/0005 in situ — Postgres la trataría como un
-- overload nuevo y dejaría la vieja de 8 parámetros huérfana con sus propios
-- grants. Se dropea explícitamente primero.

drop function if exists create_order_and_reserve_stock(
  uuid, text, text, text, jsonb, numeric, jsonb, text
);

create function create_order_and_reserve_stock(
  p_user_id uuid,
  p_guest_email text,
  p_guest_phone text,
  p_guest_nombre text,
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
    order_number, user_id, guest_email, guest_phone, guest_nombre, estado, metodo_entrega,
    direccion_envio, costo_envio, subtotal, descuento, total, coupon_id, reserva_expira_at
  ) values (
    next_order_number(), p_user_id, p_guest_email, p_guest_phone, p_guest_nombre, 'pendiente_pago', p_metodo_entrega,
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

-- create_order_and_reserve_stock ya estaba revocada de public/anon/authenticated
-- y otorgada solo a service_role en 0001/0005; como el drop de arriba también
-- tira abajo esos grants, hay que restablecerlos acá con la firma nueva.
revoke execute on function create_order_and_reserve_stock(
  uuid, text, text, text, text, jsonb, numeric, jsonb, text
) from public, anon, authenticated;
grant execute on function create_order_and_reserve_stock(
  uuid, text, text, text, text, jsonb, numeric, jsonb, text
) to service_role;
