"use client";

import { useState } from "react";
import { canAdd, type CartProduct } from "@/lib/cart";
import { BagIcon } from "../icons";
import { useCart } from "./CartProvider";

type Props = { product: CartProduct; variant?: "button" | "icon" };

/** Botão de adicionar à sacola. Respeita estoque e limites, e avisa leitores de tela. */
export function AddToCart({ product, variant = "button" }: Props) {
  const { cart, add, ready } = useCart();
  const [notice, setNotice] = useState("");
  const inCart = cart.items.find((i) => i.id === product.id)?.qty ?? 0;

  const soldOut = product.stock <= 0;
  const atLimit = !soldOut && ready && !canAdd(cart, product);

  function handleClick() {
    const ok = add(product);
    setNotice(ok ? `${product.name} adicionado à sacola.` : "Você já tem o máximo disponível deste produto na sacola.");
  }

  const label = soldOut ? "Esgotado" : atLimit ? "Máximo na sacola" : inCart > 0 ? `Adicionar mais (${inCart} na sacola)` : "Adicionar à sacola";
  const disabled = soldOut || atLimit;

  return (
    <>
      {variant === "icon" ? (
        <button type="button" className="product__bag" aria-label={disabled ? `${product.name}: ${label}` : `Adicionar ${product.name} à sacola`} disabled={disabled} onClick={handleClick}>
          <BagIcon size={18} />
        </button>
      ) : (
        <button type="button" className="btn btn--tinta" disabled={disabled} onClick={handleClick}>
          {label}
        </button>
      )}
      <span role="status" className="sr-only">
        {notice}
      </span>
    </>
  );
}
