import Image from "next/image";
import Link from "next/link";
import { getSettings, hasWhatsApp, whatsappHref } from "@/lib/settings";
import { Newsletter } from "./Newsletter";

export async function Footer() {
  const site = await getSettings();
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
          <div className="footer__contact">
            <span className="footer__city">{site.city}</span>
            {hasWhatsApp(site) && (
              <a href={whatsappHref(site)} target="_blank" rel="noopener noreferrer">
                WhatsApp {site.whatsapp_display}
              </a>
            )}
            {site.phone_tel && <a href={`tel:${site.phone_tel}`}>Tel. {site.phone}</a>}
            {site.instagram_url && (
              <a href={site.instagram_url} target="_blank" rel="noopener noreferrer">
                @{site.instagram}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
