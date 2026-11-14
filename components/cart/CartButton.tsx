"use client";

import Link from "next/link";
import { BagIcon } from "../icons";
import { useCart } from "./CartProvider";

/** Ícone da sacola no cabeçalho, com a contagem de unidades. */
export function CartButton() {
  const { count, ready } = useCart();
  const shown = ready ? count : 0;

  return (
    <Link href="/sacola" className="icon-btn icon-btn--cart" aria-label={shown > 0 ? `Sacola, ${shown} ${shown === 1 ? "item" : "itens"}` : "Sacola"}>
      <BagIcon size={20} />
      {shown > 0 && (
        <span className="cart-badge" aria-hidden="true">
          {shown}
        </span>
      )}
    </Link>
  );
}
