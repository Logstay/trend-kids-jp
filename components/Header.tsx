import Image from "next/image";
import Link from "next/link";
import { navLinks } from "@/lib/nav";
import { CartButton } from "./cart/CartButton";
import { NavLink } from "./NavLink";
import { SearchIcon } from "./icons";

export function Header() {
  return (
    <header className="header">
      <Link href="/" className="header__logo" aria-label="Trend Kids JP — início">
        <Image src="/logo-trendkids.webp" alt="Trend Kids JP" width={72} height={72} priority />
      </Link>
      <nav aria-label="Principal" className="header__nav">
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
