import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { navLinks } from "@/lib/nav";
import { CartButton } from "./cart/CartButton";
import { NavLink } from "./NavLink";
import { ShopMenu, ShopMenuArrow } from "./ShopMenu";
import { SearchIcon } from "./icons";

export function Header() {
  return (
    <header className="header">
      <Link href="/" className="header__logo" aria-label="Trend Kids JP — início">
        <Image src="/logo-trendkids.webp" alt="Trend Kids JP" width={72} height={72} priority />
      </Link>
      <nav aria-label="Principal" className="header__nav">
        <Suspense
          fallback={
            <div className="shop-menu">
              <Link href="/loja">Loja</Link>
              <span className="shop-menu__toggle" aria-hidden="true">
                <ShopMenuArrow />
              </span>
            </div>
          }
        >
          <ShopMenu />
        </Suspense>
        {navLinks.map((l) => (
          <NavLink key={l.label} href={l.href}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="header__actions">
        <Link href="/loja" className="icon-btn" aria-label="Buscar na loja">
          <SearchIcon />
        </Link>
        <CartButton />
      </div>
    </header>
  );
}
