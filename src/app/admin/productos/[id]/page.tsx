import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductEditForm } from "@/components/admin/ProductEditForm";
import { VariantsManager } from "@/components/admin/VariantsManager";
import { VariantCostosManager } from "@/components/admin/VariantCostosManager";
import { ImagesManager } from "@/components/admin/ImagesManager";

export const metadata: Metadata = { title: "Admin · Editar producto" };

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "*, product_variants(*, costos:product_variant_costos(*)), product_images(*)"
    )
    .eq("id", id)
    .single();

  if (!product) notFound();

  return (
    <div className="space-y-10">
      <h1 className="font-headline text-2xl font-extrabold uppercase tracking-wide">
        {product.nombre}
      </h1>

      <section>
        <h2 className="mb-4 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco/60">
          Datos del producto
        </h2>
        <ProductEditForm
          productId={product.id}
          initial={{
            nombre: product.nombre,
            slug: product.slug,
            tipo: product.tipo,
            club: product.club ?? "",
            liga: product.liga ?? "",
            temporada: product.temporada ?? "",
            descripcion: product.descripcion ?? "",
            precio: product.precio,
            permite_personalizacion: product.permite_personalizacion,
            activo: product.activo,
            destacado: product.destacado,
          }}
        />
      </section>

      <section>
        <h2 className="mb-4 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco/60">
          Talles y stock
        </h2>
        <VariantsManager productId={product.id} variants={product.product_variants} />
      </section>

      <section>
        <h2 className="mb-4 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco/60">
          Costos y producción
        </h2>
        <VariantCostosManager variants={product.product_variants} precio={product.precio} />
      </section>

      <section>
        <h2 className="mb-4 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco/60">
          Imágenes
        </h2>
        <ImagesManager productId={product.id} images={product.product_images} />
      </section>
    </div>
  );
}
