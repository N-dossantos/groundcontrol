import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderStatusChangeEmail } from "@/lib/email/orders";

const schema = z.object({
  estado: z.enum(["en_preparacion", "enviado", "entregado"]),
});

const estadosGestionables = ["pagado", "en_preparacion", "enviado", "entregado"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no_autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "no_autorizado" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .update({ estado: parsed.data.estado })
    .eq("id", orderId)
    .in("estado", estadosGestionables)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "no_pudimos_actualizar" }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "estado_no_actualizable" }, { status: 409 });
  }

  await sendOrderStatusChangeEmail(order, parsed.data.estado).catch((err) =>
    console.error("Error enviando email de cambio de estado", err)
  );

  return NextResponse.json({ ok: true });
}
