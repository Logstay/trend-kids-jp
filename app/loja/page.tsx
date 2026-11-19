import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { AddToCart } from "@/components/cart/AddToCart";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { WhatsAppIcon } from "@/components/icons";
import { WhatsAppCta } from "@/components/WhatsAppCta";
import { Photo } from "@/components/Photo";
import { fetchProducts, toProduct } from "@/lib/api";
import { listView } from "@/lib/empty";
import { apiFilterFor, emptyFilteredCopy, filterSummary, parseShopFilter, selectProducts, shopMenuItems } from "@/lib/shop-menu";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `Loja — ${(await getSettings()).name}` };
}

function photo(p: ReturnType<typeof toProduct>) {
  return (
    <Photo label={p.photo} src={p.image}>
      {p.stock === 0 ? <span className="product__new product__new--out">Esgotado</span> : p.isNew && <span className="product__new">Novidade</span>}
    </Photo>
  );
}

type Param = string | string[];
type Props = { searchParams: Promise<{ categoria?: Param; novidades?: Param }> };

export default async function Loja({ searchParams }: Props) {
  const filter = parseShopFilter(await searchParams);
  const site = await getSettings();

  let products: ReturnType<typeof toProduct>[] | null = null;
  try {
    products = selectProducts((await fetchProducts(apiFilterFor(filter))).map(toProduct), filter);
  } catch {
    // API fora do ar: mostra aviso e mantém o caminho do WhatsApp.
  }

  // Categoria sem resultado: confere se a loja inteira está vazia (aí não é "categoria vazia").
  let storeEmpty = false;
  if (filter.kind === "categoria" && products?.length === 0) {
    try {
      storeEmpty = (await fetchProducts({ limit: 1 })).length === 0;
    } catch {
      products = null;
    }
  }

  const view = listView(products, filter.kind !== "all", storeEmpty);
  const summary = filterSummary(filter);
  const retryHref = (shopMenuItems.find((i) => i.id === (filter.kind === "categoria" ? `categoria:${filter.categoria}` : filter.kind)) ?? shopMenuItems[0]).href;
  const filteredCopy = emptyFilteredCopy(filter);

  return (
    <>
      <Header />
      <main className="container" style={{ paddingBlock: "48px 96px", display: "grid", gap: 24 }}>
        <h1 className="display h2">Loja</h1>

        {summary && view === "list" && (
          <p className="muted">
            Mostrando: {summary} · <Link href="/loja">ver todos</Link>
          </p>
        )}

        {view === "error" && (
          <EmptyState role="alert" eyebrow="Ops" title="Não consegui carregar a vitrine agora"
            actions={
              <>
                <Link href={retryHref} className="btn btn--tinta">
                  Tentar de novo
                </Link>
                <WhatsAppCta message="Olá! Quero ver os Crocs infantis disponíveis." className="btn btn--creme">
                  <WhatsAppIcon /> Pedir pelo WhatsApp
                </WhatsAppCta>
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
                <WhatsAppCta message="Olá! Quero ver os Crocs infantis disponíveis." className="btn btn--tinta">
                  <WhatsAppIcon /> Pedir pelo WhatsApp
                </WhatsAppCta>
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
          <EmptyState title={filteredCopy.title}
            actions={
              <Link href="/loja" className="btn btn--tinta">
                Ver todos os produtos
              </Link>
            }
          >
            {filteredCopy.text}
          </EmptyState>
        )}

        {products && view === "list" && (
          <div className="featured__grid">
            {products.map((p) => (
              <article key={p.slug} className="product">
                {p.slug ? (
                  <Link href={`/loja/${p.slug}`} aria-label={p.name} tabIndex={-1} className="product__photo-link">
                    {photo(p)}
                  </Link>
                ) : (
                  photo(p)
                )}
                <div className="product__info">
                  <span className="product__cat">{p.category}</span>
                  <h2 className="product__name">{p.slug ? <Link href={`/loja/${p.slug}`}>{p.name}</Link> : p.name}</h2>
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
          <div className="hero__ctas" style={{ marginTop: 24 }}>
            <WhatsAppCta message="Olá! Quero ver os Crocs infantis disponíveis." className="btn btn--lg btn--tinta">
                  <WhatsAppIcon /> Pedir pelo WhatsApp
                </WhatsAppCta>
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
