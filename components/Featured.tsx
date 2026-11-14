"use client";

import Link from "next/link";
import { useState } from "react";
import { listView } from "@/lib/empty";
import { featuredFilters, type FeaturedFilter, type Product } from "@/lib/catalog";
import { AddToCart } from "./cart/AddToCart";
import { EmptyState } from "./EmptyState";
import { BagIcon } from "./icons";
import { Photo } from "./Photo";

export function Featured({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<FeaturedFilter>("Todos");
  const items = (filter === "Todos" ? products : products.filter((p) => p.category === filter)).slice(0, 4);

  return (
    <section className="container featured">
      <div className="featured__head">
        <h2 className="display h2">Coleções em destaque</h2>
        <div role="group" aria-label="Filtrar coleção" className="chips">
          {featuredFilters.map((f) => (
            <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {listView(items, filter !== "Todos") === "empty-filtered" && (
        <EmptyState role="status" as="h3" title={`Nada em “${filter}” por enquanto`}
          actions={
            <button type="button" className="btn btn--outline" onClick={() => setFilter("Todos")}>
              Ver todos os produtos
            </button>
          }
        >
          Esses pares acabaram ou ainda estão chegando. Dá uma olhada nas outras coleções.
        </EmptyState>
      )}
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
    </section>
  );
}
