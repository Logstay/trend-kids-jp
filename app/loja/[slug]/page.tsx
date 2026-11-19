import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { AddToCart } from "@/components/cart/AddToCart";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { WhatsAppIcon } from "@/components/icons";
import { ProductGallery } from "@/components/ProductGallery";
import { WhatsAppCta } from "@/components/WhatsAppCta";
import { fetchProduct, toProduct, type ApiProduct } from "@/lib/api";
import { stockLabel } from "@/lib/stock";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSettings();
  try {
    const p = await fetchProduct(slug);
    if (!p || p.active === false) return { title: `Produto não encontrado — ${site.name}` };
    return { title: `${p.name} — ${site.name}`, description: p.description?.trim() || undefined };
  } catch {
    return { title: `Produto — ${site.name}` };
  }
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;

  let api: ApiProduct | null;
  try {
    api = await fetchProduct(slug);
  } catch {
    return (
      <>
        <Header />
        <main className="container" style={{ paddingBlock: "48px 96px" }}>
          <EmptyState role="alert" eyebrow="Ops" title="Não conseguimos carregar este produto"
            actions={
              <>
                <Link href={`/loja/${encodeURIComponent(slug)}`} className="btn btn--tinta">
                  Tentar de novo
                </Link>
                <Link href="/loja" className="btn btn--creme">
                  Voltar para a loja
                </Link>
              </>
            }
          >
            Foi uma falha do nosso lado. Tente de novo em instantes.
          </EmptyState>
        </main>
        <Footer />
      </>
    );
  }
  if (!api || api.active === false) notFound();

  const p = toProduct(api);
  const description = api.description?.trim();
  const soldOut = !(api.stock > 0);

  return (
    <>
      <Header />
      <main className="container pdp">
        <nav aria-label="Você está em" className="crumbs">
          <Link href="/loja">Loja</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/loja?categoria=${encodeURIComponent(api.category)}`}>{api.category}</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{api.name}</span>
        </nav>

        <div className="pdp__grid">
          <ProductGallery images={p.images ?? []} name={api.name} />

          <div className="pdp__info">
            <span className="pill pill--rosa">{api.category}</span>
            <h1 className="display h2">{api.name}</h1>
            <p className="pdp__price">{p.price}</p>
            {description && <p className="muted pdp__desc">{description}</p>}
            <p className={`pdp__stock${soldOut ? " pdp__stock--out" : ""}`}>{stockLabel(api.stock)}</p>
            <div className="pdp__actions">
              <AddToCart product={{ id: api.id, slug: api.slug, name: api.name, priceCents: api.price_cents, stock: api.stock }} />
              <WhatsAppCta message={`Olá! Tenho interesse no ${api.name}.`} className="btn btn--creme">
                <WhatsAppIcon /> Pedir pelo WhatsApp
              </WhatsAppCta>
            </div>
            <Link href="/loja" className="pdp__back">
              ← Voltar para a loja
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
