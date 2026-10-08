import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/types/database.types";

export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type ProductWithRelations = ProductRow & {
  product_images: ProductImage[];
  product_variants: ProductVariant[];
  product_reviews: { calificacion: number }[];
};

export const PRODUCT_SELECT =
  "*, product_images(*), product_variants(*), product_reviews(calificacion)";

export function sortRelations(product: ProductWithRelations): ProductWithRelations {
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
  page?: number;
  pageSize?: number;
};

export type ProductsResult = {
  products: ProductWithRelations[];
  total: number;
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 24;

export async function getProducts(filters: ProductFilters = {}): Promise<ProductsResult> {
  const supabase = createPublicClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("activo", true);

  if (filters.tipo) query = query.eq("tipo", filters.tipo);
  if (filters.club) query = query.eq("club", filters.club);
  if (filters.precioMin != null) query = query.gte("precio", filters.precioMin);
  if (filters.precioMax != null) query = query.lte("precio", filters.precioMax);
  if (filters.q) {
    query = query.textSearch("search_vector", filters.q, {
      type: "websearch",
      config: "spanish",
    });
  }

  if (filters.talle) {
    const { data: variantRows } = await supabase
      .from("product_variants")
      .select("product_id")
      .eq("talle", filters.talle);

    const productIds = Array.from(new Set((variantRows ?? []).map((v) => v.product_id)));
    query = query.in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    products: (data as ProductWithRelations[]).map(sortRelations),
    total: count ?? 0,
    page,
    pageSize,
  };
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

export async function getRelatedProducts(product: ProductWithRelations, limit = 8) {
  const supabase = createPublicClient();
  const orFilters = [`tipo.eq.${product.tipo}`];
  if (product.club) orFilters.push(`club.eq.${product.club}`);

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("activo", true)
    .neq("id", product.id)
    .or(orFilters.join(","))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as ProductWithRelations[]).map(sortRelations);
}

export type ProductReview = {
  id: string;
  calificacion: number;
  comentario: string | null;
  created_at: string;
  user_id: string;
  nombre_autor: string;
};

export const REVIEW_SELECT = "id, calificacion, comentario, created_at, user_id, nombre_autor";

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(REVIEW_SELECT)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function totalStock(product: ProductWithRelations) {
  return product.product_variants.reduce((sum, v) => sum + v.stock, 0);
}

export function averageRating(product: ProductWithRelations) {
  const ratings = product.product_reviews.map((r) => r.calificacion);
  if (ratings.length === 0) return null;
  return {
    average: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
    count: ratings.length,
  };
}

export function isLowStock(variant: ProductVariant) {
  return variant.stock > 0 && variant.stock <= variant.stock_minimo;
}
