"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { Product } from "@/lib/catalog";
import { activeIndex, canScroll, isDragClick } from "@/lib/carousel";
import { ArrowLeft, ArrowRight } from "./icons";
import { Photo } from "./Photo";

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

export function Trending({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const suppressClick = useRef(false);
  const [edges, setEdges] = useState({ prev: false, next: false });
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const n = products.length;

  /** Largura de um passo (card + gap) medida no DOM. */
  const measure = useCallback(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return { track, cardWidth: card.offsetWidth, gap };
  }, []);

  const update = useCallback(() => {
    const m = measure();
    if (!m) return;
    const { track, cardWidth, gap } = m;
    const next = canScroll(track.scrollLeft, track.clientWidth, track.scrollWidth);
    setEdges((e) => (e.prev === next.prev && e.next === next.next ? e : next));
    // No fim da rolagem o último card pode não chegar ao início da tela: marca o último ponto.
    const idx = next.prev && !next.next ? n - 1 : activeIndex(track.scrollLeft, cardWidth, gap, n);
    setActive(idx);
  }, [measure, n]);

  const schedule = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(update);
  }, [update]);

  useEffect(() => {
    update();
    const track = trackRef.current;
    if (!track) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(track);
    window.addEventListener("resize", schedule);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame.current);
    };
  }, [update, schedule]);

  function scrollByCard(dir: 1 | -1) {
    const m = measure();
    if (!m) return;
    m.track.scrollBy({ left: dir * (m.cardWidth + m.gap), behavior: scrollBehavior() });
  }

  function goTo(i: number) {
    const m = measure();
    if (!m) return;
    m.track.scrollTo({ left: i * (m.cardWidth + m.gap), behavior: scrollBehavior() });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByCard(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByCard(-1);
    }
  }

  /**
   * Arrastar com o mouse. Dedo/caneta ficam por conta da rolagem nativa.
   * Sem setPointerCapture de propósito: ele redirecionaria o click para a pista e
   * o link do card nunca abriria. Os listeners vão na window.
   */
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    const startX = e.clientX;
    const startScroll = track.scrollLeft;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      if (!moved && isDragClick(dx)) {
        moved = true;
        setDragging(true); // desliga o snap enquanto arrasta, senão ele briga com scrollLeft
      }
      if (moved) track.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (moved) {
        // O click do link vem logo depois do pointerup: engole-o e libera no próximo ciclo.
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 0);
        setDragging(false); // religa o snap, que assenta no card mais próximo
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  if (n === 0) return null;
  const overflowing = edges.prev || edges.next;

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
            <button type="button" className="arrow arrow--outline" aria-label="Anterior" disabled={!edges.prev} onClick={() => scrollByCard(-1)}>
              <ArrowLeft />
            </button>
            <button type="button" className="arrow arrow--solid" aria-label="Próximo" disabled={!edges.next} onClick={() => scrollByCard(1)}>
              <ArrowRight />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className={`trending__track${dragging ? " trending__track--dragging" : ""}`}
          role="group"
          aria-label="Produtos em alta"
          tabIndex={0}
          onScroll={schedule}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onDragStart={(e) => e.preventDefault()}
          onClickCapture={(e) => {
            if (suppressClick.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          {products.map((item) => (
            <Link key={item.slug ?? item.name} href={item.slug ? `/loja/${item.slug}` : "/loja"} className="trend-card" draggable={false}>
              <Photo label={item.photo} src={item.image} />
              <div className="trend-card__meta">
                <span className="trend-card__name">{item.name}</span>
                <span className="trend-card__price">{item.price}</span>
              </div>
            </Link>
          ))}
        </div>

        {overflowing && (
          <div className="dots">
            {products.map((item, i) => (
              <button
                key={item.slug ?? item.name}
                type="button"
                className={`dot${i === active ? " dot--on" : ""}`}
                aria-label={`Ir para o produto ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
