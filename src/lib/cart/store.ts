import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductTipo } from "@/lib/products";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  nombre: string;
  tipo: ProductTipo;
  talle: string;
  productVariantId: string;
  precioUnitario: number;
  cantidad: number;
  imagenUrl?: string;
  nombreEstampado?: string;
  numeroEstampado?: string;
  stockDisponible: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateCantidad: (id: string, cantidad: number) => void;
  clear: () => void;
};

function sameLine(a: Omit<CartItem, "id">, b: CartItem) {
  return (
    a.productVariantId === b.productVariantId &&
    (a.nombreEstampado ?? "") === (b.nombreEstampado ?? "") &&
    (a.numeroEstampado ?? "") === (b.numeroEstampado ?? "")
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => sameLine(item, i));

          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((i) =>
                i.id === existing.id
                  ? {
                      ...i,
                      cantidad: Math.min(
                        i.cantidad + item.cantidad,
                        item.stockDisponible
                      ),
                    }
                  : i
              ),
            };
          }

          return {
            isOpen: true,
            items: [
              ...state.items,
              { ...item, id: crypto.randomUUID() },
            ],
          };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateCantidad: (id, cantidad) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stockDisponible)) }
              : i
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "gc90-cart",
      partialize: (state) => ({ items: state.items }), // Solo guardar los items en localStorage
    }
  )
);

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
}

export function cartItemCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.cantidad, 0);
}
