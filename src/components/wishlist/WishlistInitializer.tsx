"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useWishlistStore } from "@/lib/wishlist/store";

export function WishlistInitializer() {
  const setUser = useWishlistStore((s) => s.setUser);

  useEffect(() => {
    const supabase = createClient();

    async function load(userId: string | null) {
      if (!userId) {
        setUser(null, []);
        return;
      }
      const { data } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", userId);
      setUser(
        userId,
        (data ?? []).map((row) => row.product_id)
      );
    }

    supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return null;
}
