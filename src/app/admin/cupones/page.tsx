import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CouponsManager } from "@/components/admin/CouponsManager";

export const metadata: Metadata = { title: "Admin · Cupones" };

export default async function AdminCuponesPage() {
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 font-headline text-2xl font-extrabold uppercase tracking-wide">
        Cupones
      </h1>
      <CouponsManager coupons={coupons ?? []} />
    </div>
  );
}
