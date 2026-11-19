"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { activeIndex, isDragClick } from "@/lib/carousel";
import { ArrowLeft, ArrowRight } from "./icons";
import { Photo } from "./Photo";

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/** Galeria do produto: um slide por vez (scroll-snap), com setas, pontos, teclado e arrasto do mouse. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const stopDrag = useRef<(() => void) | null>(null);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const n = images.length;

  /** Largura de um passo (slide + gap) medida no DOM. */
  const measure = useCallback(() => {
    const track = trackRef.current;
    const slide = track?.firstElementChild as HTMLElement | null;
    if (!track || !slide) return null;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return { track, step: slide.offsetWidth + gap, width: slide.offsetWidth, gap };
  }, []);

  const update = useCallback(() => {
    const m = measure();
    if (!m) return;
    const idx = activeIndex(m.track.scrollLeft, m.width, m.gap, n);
    setActive((a) => (a === idx ? a : idx));
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
      stopDrag.current?.();
    };
  }, [update, schedule]);

  function goTo(i: number) {
    const m = measure();
    if (!m) return;
    m.track.scrollTo({ left: Math.min(n - 1, Math.max(0, i)) * m.step, behavior: scrollBehavior() });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(active + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(active - 1);
    }
  }

  /** Mouse arrasta; dedo e caneta ficam com a rolagem nativa. Listeners na window, limpos no unmount. */
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
        setDragging(true); // sem snap enquanto arrasta
      }
      if (moved) track.scrollLeft = startScroll - dx;
    };
    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      stopDrag.current = null;
    };
    const onUp = () => {
      detach();
      if (moved) setDragging(false); // religa o snap, que assenta no slide mais próximo
    };
    stopDrag.current = detach;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  if (n === 0) {
    return (
      <div className="gallery">
        <Photo label={`Foto: ${name}`} className="gallery__slide gallery__slide--solo" />
      </div>
    );
  }
  if (n === 1) {
    return (
      <div className="gallery">
        <Photo label={`${name} — foto 1 de 1`} src={images[0]} priority className="gallery__slide gallery__slide--solo" />
      </div>
    );
  }

  return (
    <div className="gallery" aria-roledescription="carrossel" aria-label={`Fotos de ${name}`}>
      <div className="gallery__stage">
        <div
          ref={trackRef}
          className={`gallery__track${dragging ? " gallery__track--dragging" : ""}`}
          role="group"
          aria-roledescription="carrossel"
          aria-label={`Fotos de ${name}`}
          tabIndex={0}
          onScroll={schedule}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onDragStart={(e) => e.preventDefault()}
        >
          {images.map((src, i) => (
            <Photo key={src} label={`${name} — foto ${i + 1} de ${n}`} src={src} priority={i === 0} className="gallery__slide" />
          ))}
        </div>
        <button type="button" className="arrow arrow--solid gallery__arrow gallery__arrow--prev" aria-label="Foto anterior" disabled={active <= 0} onClick={() => goTo(active - 1)}>
          <ArrowLeft />
        </button>
        <button type="button" className="arrow arrow--solid gallery__arrow gallery__arrow--next" aria-label="Próxima foto" disabled={active >= n - 1} onClick={() => goTo(active + 1)}>
          <ArrowRight />
        </button>
      </div>
      <div className="dots">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            className={`dot${i === active ? " dot--on" : ""}`}
            aria-label={`Ir para a foto ${i + 1} de ${n}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
