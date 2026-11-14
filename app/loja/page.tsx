import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppIcon } from "@/components/icons";
import { Photo } from "@/components/Photo";
import { fetchProducts, toProduct } from "@/lib/api";
import { featuredFilters } from "@/lib/catalog";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = { title: `Loja — ${site.name}` };

// Categorias aceitas no filtro (as mesmas do back).
const categories = [...featuredFilters.filter((f) => f !== "Todos"), "Forrados"] as const;

type Props = { searchParams: Promise<{ categoria?: string }> };

export default async function Loja({ searchParams }: Props) {
  const { categoria } = await searchParams;
  const active = categories.find((c) => c === categoria);

  let products = null;
  try {
    products = (await fetchProducts({ category: active, sort: "newest", limit: 50 })).map(toProduct);
  } catch {
    // API fora do ar: mostra aviso e mantém o caminho do WhatsApp.
  }

  return (
    <>
      <Header />
      <main className="container" style={{ paddingBlock: "48px 96px" }}>
        <h1 className="display h2">Loja</h1>

        <nav aria-label="Filtrar por categoria" className="chips" style={{ marginBlock: 24 }}>
          <Link href="/loja" className="chip" aria-current={active ? undefined : "page"}>
            Todos
          </Link>
          {categories.map((c) => (
            <Link key={c} href={`/loja?categoria=${encodeURIComponent(c)}`} className="chip" aria-current={active === c ? "page" : undefined}>
              {c}
            </Link>
          ))}
        </nav>

        {products === null && (
          <p role="alert" className="muted">
            Não consegui carregar a vitrine agora. Tente de novo em instantes ou peça pelo WhatsApp.
          </p>
        )}
        {products?.length === 0 && <p className="muted">Nenhum produto {active ? `em “${active}” ` : ""}por enquanto.</p>}

        {products && products.length > 0 && (
          <div className="featured__grid">
            {products.map((p) => (
              <article key={p.slug} className="product">
                <Photo label={p.photo} src={p.image}>
                  {p.isNew && <span className="product__new">Novidade</span>}
                </Photo>
                <div className="product__info">
                  <span className="product__cat">{p.category}</span>
                  <h2 className="product__name">{p.name}</h2>
                </div>
                <div className="product__foot">
                  <span className="product__price">{p.price}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="hero__ctas" style={{ marginTop: 48 }}>
          <a href={whatsappLink("Olá! Quero ver os Crocs infantis disponíveis.")} className="btn btn--lg btn--tinta">
            <WhatsAppIcon /> Pedir pelo WhatsApp
          </a>
          <Link href="/" className="btn btn--lg btn--creme">
            Voltar ao início
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
