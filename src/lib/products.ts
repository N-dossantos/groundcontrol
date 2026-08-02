import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database.types";

export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type ProductWithRelations = ProductRow & {
  product_images: ProductImage[];
  product_variants: ProductVariant[];
};

const PRODUCT_SELECT = "*, product_images(*), product_variants(*)";

function sortRelations(product: ProductWithRelations): ProductWithRelations {
  return {
    ...product,
    product_images: [...product.product_images].sort((a, b) => a.orden - b.orden),
    product_variants: [...product.product_variants].sort((a, b) =>
      a.talle.localeCompare(b.talle)
    ),
  };
}

export async function getFeaturedProducts(limit = 4) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("activo", true)
    .eq("destacado", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as ProductWithRelations[]).map(sortRelations);
}

export type ProductTipo = Database["public"]["Enums"]["product_tipo"];

export type ProductFilters = {
  tipo?: ProductTipo;
  club?: string;
  talle?: string;
  precioMin?: number;
  precioMax?: number;
  q?: string;
};

export async function getProducts(filters: ProductFilters = {}) {
  const supabase = createPublicClient();
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("activo", true);

  if (filters.tipo) query = query.eq("tipo", filters.tipo);
  if (filters.club) query = query.eq("club", filters.club);
  if (filters.precioMin != null) query = query.gte("precio", filters.precioMin);
  if (filters.precioMax != null) query = query.lte("precio", filters.precioMax);
  if (filters.q) query = query.ilike("nombre", `%${filters.q}%`);

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  let products = (data as ProductWithRelations[]).map(sortRelations);

  if (filters.talle) {
    products = products.filter((p) =>
      p.product_variants.some((v) => v.talle === filters.talle)
    );
  }

  return products;
}

export async function getProductBySlug(slug: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (error || !data) return null;
  return sortRelations(data as ProductWithRelations);
}

export async function getAllProductSlugs() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("products").select("slug").eq("activo", true);
  return (data ?? []).map((p) => p.slug);
}

export async function getClubes() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("club")
    .eq("activo", true)
    .not("club", "is", null);

  return Array.from(new Set((data ?? []).map((p) => p.club).filter((c): c is string => !!c)));
}

export function totalStock(product: ProductWithRelations) {
  return product.product_variants.reduce((sum, v) => sum + v.stock, 0);
}

export function isLowStock(variant: ProductVariant) {
  return variant.stock > 0 && variant.stock <= variant.stock_minimo;
}
