import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { AddToCart } from "./cart/AddToCart";
import { BagIcon } from "./icons";
import { Photo } from "./Photo";

export function Featured({ products }: { products: Product[] }) {
  const items = products.slice(0, 4);

  return (
    <section className="container featured">
      <div className="featured__head">
        <h2 className="display h2">Coleções em destaque</h2>
      </div>
      <div className="featured__grid">
        {items.map((p) => (
          <article key={p.name} className="product">
            <Photo label={p.photo} src={p.image}>
              {p.isNew && <span className="product__new">Novidade</span>}
            </Photo>
            <div className="product__info">
              <span className="product__cat">{p.category}</span>
              <h3 className="product__name">{p.name}</h3>
            </div>
            <div className="product__foot">
              <span className="product__price">{p.price}</span>
              {p.id && p.slug && p.priceCents !== undefined && p.stock !== undefined ? (
                <AddToCart product={{ id: p.id, slug: p.slug, name: p.name, priceCents: p.priceCents, stock: p.stock }} variant="icon" />
              ) : (
                <Link href="/loja" className="product__bag" aria-label={`Ver ${p.name} na loja`}>
                  <BagIcon size={18} />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="featured__more">
        <Link href="/loja" className="btn btn--outline">
          Ver todos os modelos
        </Link>
      </div>
    </section>
  );
}
