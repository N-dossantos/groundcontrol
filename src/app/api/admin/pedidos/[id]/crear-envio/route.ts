import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crearEnvioAndreani } from "@/lib/andreani/envios";

// Escape hatch manual (ver Phase 7c del roadmap): si el webhook no pudo crear
// el envío (Andreani caído, credenciales sin configurar en el momento del
// pago, etc.), un admin puede reintentarlo desde el detalle del pedido en vez
// de esperar un reintento automático de Mercado Pago.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no_autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "no_autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) {
    return NextResponse.json({ error: "pedido_no_encontrado" }, { status: 404 });
  }

  if (order.metodo_entrega !== "envio_domicilio") {
    return NextResponse.json({ error: "pedido_no_es_envio_domicilio" }, { status: 400 });
  }

  if (order.andreani_numero_envio) {
    return NextResponse.json({ ok: true, yaCreado: true, numeroEnvio: order.andreani_numero_envio });
  }

  if (order.estado === "pendiente_pago" || order.estado === "cancelado") {
    return NextResponse.json({ error: "pedido_no_pagado" }, { status: 400 });
  }

  const envio = await crearEnvioAndreani(order);
  if (!envio) {
    return NextResponse.json({ error: "error_creando_envio" }, { status: 502 });
  }

  await admin
    .from("orders")
    .update({
      andreani_numero_envio: envio.numeroEnvio,
      andreani_envio_creado_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  await admin.from("audit_logs").insert({
    admin_id: user.id,
    accion: "crear_envio_andreani",
    entidad: "orders",
    entidad_id: orderId,
    metadata: { numero_envio: envio.numeroEnvio },
  });

  return NextResponse.json({ ok: true, numeroEnvio: envio.numeroEnvio });
}
