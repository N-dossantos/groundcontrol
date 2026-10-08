import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { sortRelations, PRODUCT_SELECT, type ProductWithRelations } from "@/lib/products";
import { FavoritosGrid } from "@/components/wishlist/FavoritosGrid";

export const metadata: Metadata = { title: "Mis favoritos" };

export default async function FavoritosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("wishlists")
    .select(`product_id, products(${PRODUCT_SELECT})`)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const products = (data ?? [])
    .map((row) => row.products)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => sortRelations(p as unknown as ProductWithRelations));

  return <FavoritosGrid products={products} />;
}
