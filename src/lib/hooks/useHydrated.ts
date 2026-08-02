import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * true solo después de la hidratación. Evita el mismatch SSR/cliente al leer
 * stores persistidos en localStorage (ej. el carrito) sin recurrir a
 * setState dentro de un efecto.
 */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
