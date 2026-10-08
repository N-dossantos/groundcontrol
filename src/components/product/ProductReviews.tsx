"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { REVIEW_SELECT, type ProductReview } from "@/lib/products";

function estrellas(calificacion: number) {
  return "★".repeat(calificacion) + "☆".repeat(5 - calificacion);
}

export function ProductReviews({
  productId,
  initialReviews,
}: {
  productId: string;
  initialReviews: ProductReview[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const propia = reviews.find((r) => r.user_id === userId);
  const promedio = reviews.length
    ? reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length
    : null;

  return (
    <section className="mt-12 border-t border-gc-carbon pt-8">
      <h2 className="font-headline text-xl font-extrabold uppercase tracking-wide">
        Reseñas
        {promedio != null && (
          <span className="ml-2 text-gc-dorado">
            {estrellas(Math.round(promedio))} {promedio.toFixed(1)} ({reviews.length})
          </span>
        )}
      </h2>

      {reviews.length === 0 && (
        <p className="mt-3 text-sm text-gc-blanco/60">
          Todavía no hay reseñas para este producto.
        </p>
      )}

      <ul className="mt-4 space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-lg border border-gc-carbon bg-gc-carbon/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{r.nombre_autor}</p>
              <span className="text-sm text-gc-dorado">{estrellas(r.calificacion)}</span>
            </div>
            {r.comentario && (
              <p className="mt-1 text-sm text-gc-blanco/70">{r.comentario}</p>
            )}
          </li>
        ))}
      </ul>

      {userId === null && (
        <p className="mt-6 text-sm text-gc-blanco/60">
          <Link href="/login" className="underline hover:text-gc-blanco">
            Iniciá sesión
          </Link>{" "}
          para dejar tu reseña.
        </p>
      )}

      {userId && (
        <ReviewForm
          key={propia?.id ?? "new"}
          productId={productId}
          userId={userId}
          initial={propia}
          onSaved={(saved) =>
            setReviews((prev) =>
              propia ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev]
            )
          }
          onDeleted={() => setReviews((prev) => prev.filter((r) => r.id !== propia?.id))}
        />
      )}
    </section>
  );
}

function ReviewForm({
  productId,
  userId,
  initial,
  onSaved,
  onDeleted,
}: {
  productId: string;
  userId: string;
  initial: ProductReview | undefined;
  onSaved: (review: ProductReview) => void;
  onDeleted: () => void;
}) {
  const [calificacion, setCalificacion] = useState(initial?.calificacion ?? 5);
  const [comentario, setComentario] = useState(initial?.comentario ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const supabase = createClient();
    const payload = {
      product_id: productId,
      user_id: userId,
      calificacion,
      comentario: comentario.trim() || null,
    };

    const query = initial
      ? supabase.from("product_reviews").update(payload).eq("id", initial.id)
      : supabase.from("product_reviews").insert(payload);

    const { data, error } = await query.select(REVIEW_SELECT).single();

    setSubmitting(false);
    if (error || !data) return;

    onSaved(data);
  }

  async function handleDelete() {
    if (!initial) return;
    const supabase = createClient();
    await supabase.from("product_reviews").delete().eq("id", initial.id);
    onDeleted();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gc-blanco/70">
          Tu calificación
        </label>
        <select
          value={calificacion}
          onChange={(e) => setCalificacion(Number(e.target.value))}
          className="rounded-md border border-gc-blanco/15 bg-gc-carbon px-3 py-2 text-sm text-gc-blanco"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "estrella" : "estrellas"}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Contanos tu experiencia (opcional)"
        rows={3}
        className="w-full rounded-md border border-gc-blanco/15 bg-gc-carbon px-4 py-3 text-sm text-gc-blanco placeholder:text-gc-blanco/40"
      />
      <div className="flex gap-2">
        <Button type="submit" isLoading={submitting}>
          {initial ? "Actualizar reseña" : "Publicar reseña"}
        </Button>
        {initial && (
          <Button type="button" variant="ghost" onClick={handleDelete}>
            Eliminar
          </Button>
        )}
      </div>
    </form>
  );
}
