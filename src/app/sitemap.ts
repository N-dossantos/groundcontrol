import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const slugs = await getAllProductSlugs();

  const staticRoutes = ["", "/catalogo", "/camisetas", "/shorts", "/conjuntos"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
    })
  );

  const productRoutes = slugs.map((slug) => ({
    url: `${siteUrl}/productos/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...productRoutes];
}
