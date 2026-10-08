import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

type WishlistState = {
  userId: string | null;
  status: "loading" | "ready";
  productIds: Set<string>;
  setUser: (userId: string | null, productIds: string[]) => void;
  toggle: (productId: string) => Promise<void>;
};

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  userId: null,
  status: "loading",
  productIds: new Set(),
  setUser: (userId, productIds) =>
    set({ userId, status: "ready", productIds: new Set(productIds) }),
  toggle: async (productId) => {
    const { userId, productIds } = get();
    if (!userId) return;

    const isFavorited = productIds.has(productId);
    const next = new Set(productIds);
    if (isFavorited) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    set({ productIds: next });

    const supabase = createClient();
    const { error } = isFavorited
      ? await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId)
      : await supabase.from("wishlists").insert({ user_id: userId, product_id: productId });

    if (error) set({ productIds }); // revierte el optimistic update si falló
  },
}));
