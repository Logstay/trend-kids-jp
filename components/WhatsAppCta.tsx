"use client";

import { useId, useRef, type ReactNode } from "react";
import { whatsappTarget } from "@/lib/sellers";
import { useSellers } from "./SellersProvider";
import { useSettings } from "./SettingsProvider";

type Props = { message: string; className?: string; children: ReactNode };

/**
 * Botão de WhatsApp. Para quem ele leva depende do cadastro (ver `whatsappTarget`):
 * 2+ vendedoras ativas abrem um seletor "Com quem você quer falar?"; 1 vai direto; nenhuma cai no contato da loja.
 */
export function WhatsAppCta({ message, className, children }: Props) {
  const settings = useSettings();
  const sellers = useSellers();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const target = whatsappTarget(sellers, settings, message);

  if (target.kind === "none") {
    return (
      <a href={target.href} className={className}>
        {children}
      </a>
    );
  }
  if (target.kind === "direct") {
    return (
      <a href={target.href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  // <dialog> nativo: o navegador cuida do foco preso, do Esc e do fundo escurecido.
  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        {children}
      </button>
      <dialog
        ref={dialog}
        className="picker"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close(); // clique no fundo escurecido
        }}
      >
        <div className="picker__box">
          <h2 id={titleId} className="display picker__title">
            Com quem você quer falar?
          </h2>
          <p className="muted">Escolha uma vendedora para continuar no WhatsApp.</p>
          <ul className="picker__list">
            {target.options.map((o) => (
              <li key={o.id}>
                <a href={o.href} className="picker__item" target="_blank" rel="noopener noreferrer" onClick={() => dialog.current?.close()}>
                  <span className="picker__name">{o.name}</span>
                  <span className="picker__num">{o.display}</span>
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--outline" onClick={() => dialog.current?.close()}>
            Cancelar
          </button>
        </div>
      </dialog>
    </>
  );
}
