"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Seller } from "@/lib/sellers";

const SellersContext = createContext<Seller[]>([]);

/** Entrega ao lado cliente as vendedoras ativas que o servidor leu. */
export function SellersProvider({ value, children }: { value: Seller[]; children: ReactNode }) {
  return <SellersContext.Provider value={value}>{children}</SellersContext.Provider>;
}

export const useSellers = (): Seller[] => useContext(SellersContext);
