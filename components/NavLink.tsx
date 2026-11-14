import Link from "next/link";
import type { ReactNode } from "react";
import { isSectionAnchor } from "@/lib/nav";

/** Âncora de seção => <a> nativo (rola e atualiza a URL); página => <Link> do Next. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  if (isSectionAnchor(href)) return <a href={href}>{children}</a>;
  return <Link href={href}>{children}</Link>;
}
