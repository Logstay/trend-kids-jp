"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { activeMenuItemId, parseShopFilter, shopMenuItems } from "@/lib/shop-menu";

export function ShopMenuArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ShopMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const sp = useSearchParams();
  const spKey = sp.toString();
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const activeId = activeMenuItemId(
    pathname,
    parseShopFilter({ categoria: sp.getAll("categoria"), novidades: sp.getAll("novidades") }),
  );

  // Trocar de página ou de filtro fecha o menu.
  useEffect(() => {
    setOpen(false);
  }, [pathname, spKey]);

  // Clique/toque fora fecha (registrado só enquanto aberto).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // Esc em document: funciona mesmo com o foco no body.
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Foco saindo do componente fecha (relatedTarget nulo é tratado pelo pointerdown).
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && !e.currentTarget.contains(next)) setOpen(false);
  };

  return (
    <div className="shop-menu" ref={wrapRef} onBlur={onBlur}>
      <Link href="/loja" onClick={() => setOpen(false)}>
        Loja
      </Link>
      <button
        ref={toggleRef}
        type="button"
        className="shop-menu__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Abrir menu da Loja"
        onClick={() => setOpen((o) => !o)}
      >
        <ShopMenuArrow />
      </button>
      <ul id={panelId} className="shop-menu__panel" hidden={!open}>
        {shopMenuItems.map((item, i) => (
          <Fragment key={item.id}>
            {i > 0 && item.group !== shopMenuItems[i - 1].group && <li aria-hidden="true" className="shop-menu__sep" />}
            <li>
              <Link
                href={item.href}
                aria-current={activeId === item.id ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
