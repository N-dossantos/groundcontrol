import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMercadoPagoConfig } from "@/lib/mercadopago/client";
import { buildPreferenceBody } from "@/lib/mercadopago/preference";
import { crearPreferenciaSchema } from "@/lib/validations/checkout";
import { getAppSettings } from "@/lib/settings";

function mapRpcError(message: string): { code: string; status: number } {
  if (message.includes("carrito_vacio")) return { code: "carrito_vacio", status: 400 };
  if (message.includes("sin_stock")) return { code: "sin_stock", status: 409 };
  if (message.includes("variante_no_encontrada")) return { code: "producto_invalido", status: 400 };
  if (message.includes("cupon_invalido")) return { code: "cupon_invalido", status: 400 };
  return { code: "error_desconocido", status: 500 };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "json_invalido" }, { status: 400 });
  }

  const parsed = crearPreferenciaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "datos_invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items, metodoEntrega, direccion, contacto, cuponCodigo } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const settings = await getAppSettings();
  const costoEnvio = metodoEntrega === "envio_domicilio" ? settings.costo_envio_domicilio : 0;

  const admin = createAdminClient();

  // `supabase gen types` no marca como nullable los parámetros de función que
  // sí aceptan NULL en Postgres — casts puntuales para reflejar la firma real
  // de create_order_and_reserve_stock (los nombres de clave siguen chequeados).
  const { data: order, error: rpcError } = await admin.rpc("create_order_and_reserve_stock", {
    p_user_id: (user?.id ?? null) as string,
    p_guest_email: (user ? null : contacto.email) as string,
    p_guest_phone: (user ? null : contacto.telefono) as string,
    p_metodo_entrega: metodoEntrega,
    p_direccion_envio: (metodoEntrega === "envio_domicilio" ? direccion : null) as never,
    p_costo_envio: costoEnvio,
    p_items: items.map((item) => ({
      product_variant_id: item.productVariantId,
      cantidad: item.cantidad,
      nombre_estampado: item.nombreEstampado ?? null,
      numero_estampado: item.numeroEstampado ?? null,
    })) as never,
    p_coupon_codigo: cuponCodigo ?? undefined,
  });

  if (rpcError || !order) {
    const { code, status } = mapRpcError(rpcError?.message ?? "");
    return NextResponse.json({ error: code }, { status });
  }

  const { data: orderItems } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const preferenceClient = new Preference(getMercadoPagoConfig());
    const preference = await preferenceClient.create({
      body: buildPreferenceBody({
        order,
        items: orderItems ?? [],
        contactoEmail: contacto.email,
        contactoNombre: contacto.nombre,
        contactoTelefono: contacto.telefono,
        siteUrl,
      }),
    });

    await admin.from("orders").update({ mp_preference_id: preference.id }).eq("id", order.id);

    // Registra el intento de pago aunque el webhook nunca llegue a confirmarlo
    // (notification_url mal configurada, MP caído, etc.) — sin esto, un pedido
    // pagado pero sin webhook queda sin ningún registro en `payments` y el
    // endpoint de reembolso no tiene con qué reembolsar.
    await admin.from("payments").insert({
      order_id: order.id,
      proveedor: "mercado_pago",
      mp_preference_id: preference.id,
      estado: "pendiente",
      monto: order.total,
      moneda: order.moneda,
    });

    return NextResponse.json({
      initPoint: preference.init_point,
      orderNumber: order.order_number,
    });
  } catch {
    // La pasarela falló: liberamos la reserva de stock/cupón para no dejar
    // unidades retenidas por un pedido que nunca va a poder pagarse.
    await admin.rpc("release_order_reservation", {
      p_order_id: order.id,
      p_nuevo_estado: "cancelado",
    });
    return NextResponse.json({ error: "error_pasarela_pago" }, { status: 502 });
  }
}
