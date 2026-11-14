import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { AddToCart } from "@/components/cart/AddToCart";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { WhatsAppIcon } from "@/components/icons";
import { Photo } from "@/components/Photo";
import { fetchProducts, toProduct } from "@/lib/api";
import { listView } from "@/lib/empty";
import { featuredFilters } from "@/lib/catalog";
import { getSettings, whatsappHref } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Loja — ${(await getSettings()).name}` };
}

// Categorias aceitas no filtro (as mesmas do back).
const categories = [...featuredFilters.filter((f) => f !== "Todos"), "Forrados"] as const;

type Props = { searchParams: Promise<{ categoria?: string }> };

export default async function Loja({ searchParams }: Props) {
  const { categoria } = await searchParams;
  const site = await getSettings();
  const active = categories.find((c) => c === categoria);

  let products: ReturnType<typeof toProduct>[] | null = null;
  try {
    products = (await fetchProducts({ category: active, sort: "newest", limit: 50 })).map(toProduct);
  } catch {
    // API fora do ar: mostra aviso e mantém o caminho do WhatsApp.
  }

  const view = listView(products, Boolean(active));

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

        {view === "error" && (
          <EmptyState role="alert" eyebrow="Ops" title="Não consegui carregar a vitrine agora"
            actions={
              <>
                <Link href={active ? `/loja?categoria=${encodeURIComponent(active)}` : "/loja"} className="btn btn--tinta">
                  Tentar de novo
                </Link>
                <a href={whatsappHref(site, "Olá! Quero ver os Crocs infantis disponíveis.")} className="btn btn--creme">
                  <WhatsAppIcon /> Pedir pelo WhatsApp
                </a>
              </>
            }
          >
            Foi uma falha do nosso lado. Tente de novo em instantes ou peça direto pelo WhatsApp.
          </EmptyState>
        )}
        {view === "empty" && (
          <EmptyState eyebrow="Loja" title="Ainda não temos pares por aqui"
            actions={
              <>
                <a href={whatsappHref(site, "Olá! Quero ver os Crocs infantis disponíveis.")} className="btn btn--tinta">
                  <WhatsAppIcon /> Pedir pelo WhatsApp
                </a>
                <Link href="/" className="btn btn--creme">
                  Voltar ao início
                </Link>
              </>
            }
          >
            A vitrine online está sendo montada. Peça pelo WhatsApp que a gente separa o par do seu pequeno.
          </EmptyState>
        )}
        {view === "empty-filtered" && (
          <EmptyState title={`Nada em “${active}” por enquanto`}
            actions={
              <Link href="/loja" className="btn btn--tinta">
                Ver todos os produtos
              </Link>
            }
          >
            Esses pares acabaram ou ainda estão chegando. Dá uma olhada nas outras coleções.
          </EmptyState>
        )}

        {products && view === "list" && (
          <div className="featured__grid">
            {products.map((p) => (
              <article key={p.slug} className="product">
                <Photo label={p.photo} src={p.image}>
                  {p.stock === 0 ? <span className="product__new product__new--out">Esgotado</span> : p.isNew && <span className="product__new">Novidade</span>}
                </Photo>
                <div className="product__info">
                  <span className="product__cat">{p.category}</span>
                  <h2 className="product__name">{p.name}</h2>
                </div>
                <div className="product__foot">
                  <span className="product__price">{p.price}</span>
                  {p.id && p.slug && p.priceCents !== undefined && p.stock !== undefined && (
                    <AddToCart product={{ id: p.id, slug: p.slug, name: p.name, priceCents: p.priceCents, stock: p.stock }} variant="icon" />
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {(view === "list" || view === "empty-filtered") && (
          <div className="hero__ctas" style={{ marginTop: 48 }}>
            <a href={whatsappHref(site, "Olá! Quero ver os Crocs infantis disponíveis.")} className="btn btn--lg btn--tinta">
              <WhatsAppIcon /> Pedir pelo WhatsApp
            </a>
            <Link href="/" className="btn btn--lg btn--creme">
              Voltar ao início
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
