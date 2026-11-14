"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { ArrowLeft, ArrowRight } from "./icons";
import { Photo } from "./Photo";

export function Trending({ products }: { products: Product[] }) {
  const [slide, setSlide] = useState(0);
  const n = products.length;
  if (n === 0) return null;
  const visible = [0, 1, 2].map((k) => ({ item: products[(slide + k) % n], active: k === 1 }));

  return (
    <section id="novidades" className="trending" aria-roledescription="carrossel" aria-label="Em alta agora">
      <div className="trending__inner">
        <div className="section-head">
          <div className="section-head__text">
            <span className="pill pill--azul">Chegou</span>
            <h2 className="display h2">Em alta agora</h2>
            <p className="muted">Os modelos e cores que a criançada mais levou nesta semana.</p>
          </div>
          <div className="arrows">
            <button type="button" className="arrow arrow--outline" aria-label="Anterior" onClick={() => setSlide((s) => (s - 1 + n) % n)}>
              <ArrowLeft />
            </button>
            <button type="button" className="arrow arrow--solid" aria-label="Próximo" onClick={() => setSlide((s) => (s + 1) % n)}>
              <ArrowRight />
            </button>
          </div>
        </div>

        <div className="trending__grid" aria-live="polite">
          {visible.map(({ item, active }, k) => (
            <Link key={`${item.name}-${k}`} href="/loja" className={`trend-card${active ? " trend-card--active" : ""}`}>
              <Photo label={item.photo} src={item.image}>
                {active && <span className="trend-card__badge">Mais vendido</span>}
              </Photo>
              <div className="trend-card__meta">
                <span className="trend-card__name">{item.name}</span>
                <span className="trend-card__price">{item.price}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="dots" aria-hidden="true">
          {products.map((t, i) => (
            <span key={t.name} className={`dot${i === slide ? " dot--on" : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
