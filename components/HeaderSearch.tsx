"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "./icons";

/** A lupa só aparece dentro da loja (/loja e as páginas de produto). Nas outras páginas não renderiza nada. */
export function HeaderSearch() {
  const pathname = usePathname();
  const inStore = pathname === "/loja" || pathname.startsWith("/loja/");
  if (!inStore) return null;
  return (
    <Link href="/loja" className="icon-btn" aria-label="Buscar na loja">
      <SearchIcon />
    </Link>
  );
}
