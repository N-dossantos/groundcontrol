import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({ role: z.enum(["admin", "customer"]) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: clienteId } = await context.params;

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

  if (clienteId === user.id) {
    return NextResponse.json({ error: "no_podes_cambiar_tu_propio_rol" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: cliente } = await admin
    .from("profiles")
    .select("role")
    .eq("id", clienteId)
    .single();

  if (!cliente) {
    return NextResponse.json({ error: "cliente_no_encontrado" }, { status: 404 });
  }

  const { data: updated, error } = await admin
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", clienteId)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "no_pudimos_actualizar" }, { status: 500 });
  }

  await admin.from("audit_logs").insert({
    admin_id: user.id,
    accion: parsed.data.role === "admin" ? "promover_admin" : "revocar_admin",
    entidad: "profiles",
    entidad_id: clienteId,
    metadata: { role_anterior: cliente.role, role_nuevo: parsed.data.role },
  });

  return NextResponse.json({ ok: true, role: updated.role });
}
