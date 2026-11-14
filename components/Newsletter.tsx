"use client";

import { useState, type FormEvent } from "react";

/**
 * Formulário da newsletter. Ainda não envia para lugar nenhum:
 * conecte `onSubscribe` ao provedor de e-mail (ou ao endpoint do back) antes de publicar.
 */
export function Newsletter({ onSubscribe }: { onSubscribe?: (email: string) => Promise<void> }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email")?.toString() ?? "";
    setState("sending");
    try {
      await onSubscribe?.(email);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <form className="news" onSubmit={handleSubmit}>
      <label htmlFor="news-email">Seu e-mail</label>
      <div className="news__field">
        <input id="news-email" name="email" type="email" required autoComplete="email" placeholder="nome@email.com" />
        <button type="submit" className="btn btn--tinta" disabled={state === "sending"}>
          Quero receber
        </button>
      </div>
      <span role="status" className="news__status">
        {state === "done" && "Pronto! Você está na lista."}
        {state === "error" && "Não deu certo. Tente de novo em instantes."}
      </span>
    </form>
  );
}
