"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addItem, canAdd, cartCount, emptyCart, parseCart, removeItem, serializeCart, setQty as setQtyPure, type Cart, type CartProduct } from "@/lib/cart";

const KEY = "tk-cart-v1";

type CartContextValue = {
  cart: Cart;
  /** false até a sacola salva ser lida no navegador (evita divergência entre servidor e cliente). */
  ready: boolean;
  count: number;
  /** Devolve false se não coube (sem estoque, limite de unidades ou de produtos). */
  add: (product: CartProduct) => boolean;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function read(): Cart {
  try {
    return parseCart(window.localStorage.getItem(KEY));
  } catch {
    return emptyCart; // modo privado ou armazenamento bloqueado: a sacola vive só nesta aba
  }
}

function write(cart: Cart) {
  try {
    window.localStorage.setItem(KEY, serializeCart(cart));
  } catch {
    /* sem armazenamento: segue funcionando em memória */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(read());
    setReady(true);
    // Outra aba mexeu na sacola: acompanha.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setCart(parseCart(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (c: Cart) => Cart) => {
    setCart((prev) => {
      const next = fn(prev);
      if (next !== prev) write(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (product: CartProduct) => {
      const fits = canAdd(cart, product);
      update((c) => addItem(c, product));
      return fits;
    },
    [cart, update],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      count: cartCount(cart),
      add,
      setQty: (id, qty) => update((c) => setQtyPure(c, id, qty)),
      remove: (id) => update((c) => removeItem(c, id)),
      clear: () => update(() => emptyCart),
    }),
    [cart, ready, add, update],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}
