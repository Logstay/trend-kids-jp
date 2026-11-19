"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { homeNav } from "@/lib/nav";

/**
 * "Início": sempre leva ao topo. Na landing o <Link> do Next não faria nada (mesma rota),
 * então rolamos até o topo sem recarregar; em outras páginas a navegação normal já abre no topo.
 */
export function HomeLink() {
  const pathname = usePathname();
  const onLanding = pathname === "/";

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!onLanding || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
  }

  return (
    <Link href={homeNav.href} scroll onClick={handleClick} aria-current={onLanding ? "page" : undefined}>
      {homeNav.label}
    </Link>
  );
}
