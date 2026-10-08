"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/cart/store";

// Espeja el carrito Zustand a la tabla `carts` mientras hay sesión, para que
// el cron de carrito abandonado pueda detectar inactividad. Invitados quedan
// fuera a propósito: sin sesión no hay email conocido antes del checkout.
export function CartSyncInitializer() {
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function syncNow(userId: string) {
      await supabase.from("carts").upsert({
        user_id: userId,
        items: useCartStore.getState().items,
        reminder_sent_at: null,
      });
    }

    function setUser(userId: string | null) {
      userIdRef.current = userId;
      if (userId && useCartStore.getState().items.length > 0) {
        syncNow(userId);
      }
    }

    supabase.auth.getUser().then(({ data }) => setUser(data.user?.id ?? null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?.id ?? null);
    });

    let debounce: ReturnType<typeof setTimeout> | null = null;
    const unsubscribeCart = useCartStore.subscribe(() => {
      const userId = userIdRef.current;
      if (!userId) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => syncNow(userId), 800);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeCart();
      if (debounce) clearTimeout(debounce);
    };
  }, []);

  return null;
}
