import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppIcon } from "@/components/icons";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: `Loja — ${site.name}` };

// Enquanto a loja (catálogo + sacola) não é portada do canvas, esta rota leva o
// cliente direto ao WhatsApp, em vez de um link quebrado.
export default function Loja() {
  return (
    <>
      <Header />
      <main className="container" style={{ paddingBlock: "48px 96px" }}>
        <div className="hero__card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 24 }}>
          <span className="pill pill--creme">Loja online</span>
          <h1 className="display hero__title" style={{ fontSize: "clamp(40px, 5vw, 64px)" }}>
            A vitrine completa está chegando.
          </h1>
          <p className="hero__lead">Enquanto isso, mande o modelo e o tamanho pelo WhatsApp que a gente separa o par.</p>
          <div className="hero__ctas">
            <a href={whatsappLink("Olá! Quero ver os Crocs infantis disponíveis.")} className="btn btn--lg btn--tinta">
              <WhatsAppIcon /> Pedir pelo WhatsApp
            </a>
            <Link href="/" className="btn btn--lg btn--creme">
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
