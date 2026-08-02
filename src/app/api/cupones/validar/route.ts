import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  codigo: z.string().min(1),
  subtotal: z.number().nonnegative(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "datos_invalidos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("validate_coupon", {
    p_codigo: parsed.data.codigo,
    p_subtotal: parsed.data.subtotal,
  });

  if (error) {
    return NextResponse.json({ error: "error_validando_cupon" }, { status: 500 });
  }

  const resultado = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    valido: resultado?.valido ?? false,
    motivo: resultado?.motivo ?? null,
    descuento: resultado?.descuento ?? 0,
  });
}
