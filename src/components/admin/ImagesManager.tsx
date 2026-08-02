"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];

export function ImagesManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    const supabase = createClient();

    const path = `${productId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file);

    if (uploadError) {
      setError("No pudimos subir la imagen.");
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(path);

    await supabase.from("product_images").insert({
      product_id: productId,
      url: publicUrl,
      alt_text: null,
      orden: images.length,
    });

    setUploading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("product_images").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((image) => (
          <div key={image.id} className="relative h-24 w-24 overflow-hidden rounded-md border border-gc-carbon">
            <Image src={image.url} alt={image.alt_text ?? ""} fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(image.id)}
              className="absolute right-1 top-1 rounded bg-gc-negro/80 px-1.5 text-xs text-gc-blanco hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <label className="mt-4 inline-block">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <span className="inline-flex items-center justify-center gap-2 rounded-full border border-gc-blanco/30 px-6 py-3 font-headline text-sm font-extrabold uppercase tracking-wide text-gc-blanco transition-colors hover:border-gc-blanco">
          {uploading ? "Subiendo..." : "+ Subir imagen"}
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
