import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { Newsletter } from "./Newsletter";

export function Footer() {
  return (
    <footer id="contato" className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__pitch">
            <h2 className="display h2">Saiba primeiro quando chegar cor nova.</h2>
            <p>Um e-mail por semana. Sem spam.</p>
          </div>
          <Newsletter />
        </div>
        <div className="footer__bottom">
          <Image className="footer__logo" src="/logo-trendkids.webp" alt="Trend Kids JP" width={88} height={88} />
          <nav aria-label="Rodapé" className="footer__nav">
            <Link href="/loja">Loja</Link>
            <a href="#historia">Nossa história</a>
            <a href="#contato">Guia de tamanhos e trocas</a>
          </nav>
          <span className="footer__city">{site.city}</span>
        </div>
      </div>
    </footer>
  );
}
