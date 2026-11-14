"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { revalidateSite } from "@/app/admin/actions";
import { ApiError, apiRequest } from "@/lib/admin";
import type { StoreSettings } from "@/lib/settings";

type Message = { kind: "ok" | "error"; text: string };

export function SettingsForm({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  // Os campos mostram o que a pessoa digita; depois de salvar voltam ao valor já normalizado pelo servidor.
  const [form, setForm] = useState({
    name: initial.name,
    city: initial.city,
    description: initial.description,
    whatsapp: initial.whatsapp_display,
    phone: initial.phone,
    instagram: initial.instagram,
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setMessage(null);
    try {
      // Substituição completa: o servidor exige todos os campos, e "" apaga o contato de propósito.
      const next = await apiRequest<StoreSettings>("PUT", "/v1/admin/settings", form);
      setSaved(next);
      setForm({ name: next.name, city: next.city, description: next.description, whatsapp: next.whatsapp_display, phone: next.phone, instagram: next.instagram });
      // A confirmação aparece assim que a API responde. Atualizar o cache do site público é um passo
      // separado: só depois que ele termina é verdade dizer que o site já mostra os dados novos.
      setMessage({ kind: "ok", text: "Configurações salvas." });
      revalidateSite()
        .then(() => {
          setMessage({ kind: "ok", text: "Configurações salvas. O site já mostra os novos dados." });
          router.refresh();
        })
        .catch(() => setMessage({ kind: "ok", text: "Configurações salvas. O site pode levar até 30 segundos para mostrar as mudanças." }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setMessage({ kind: "error", text: err instanceof ApiError ? err.message : "Algo deu errado. Tente novamente." });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="admin-panel" aria-labelledby="cfg">
      <h2 id="cfg" className="admin-panel__title">
        Dados da loja
      </h2>
      <p className="muted">Estes dados aparecem no site inteiro: botões de WhatsApp, rodapé, “Nossa história” e a mensagem dos pedidos.</p>

      <form className="admin-form admin-form--grid admin-form--top" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Nome da loja</label>
          <input id="name" required maxLength={80} value={form.name} onChange={set("name")} />
        </div>
        <div className="field">
          <label htmlFor="city">Cidade</label>
          <input id="city" required maxLength={80} value={form.city} onChange={set("city")} />
        </div>
        <div className="field">
          <label htmlFor="whatsapp">WhatsApp</label>
          <input id="whatsapp" inputMode="tel" autoComplete="off" placeholder="(83) 99999-1234" value={form.whatsapp} onChange={set("whatsapp")} aria-describedby="whatsapp-help" />
          <small id="whatsapp-help" className="field__help">
            Número com DDD. É para onde vão os pedidos. Deixe vazio para esconder os botões de WhatsApp.
          </small>
        </div>
        <div className="field">
          <label htmlFor="phone">Telefone (opcional)</label>
          <input id="phone" inputMode="tel" autoComplete="off" placeholder="(83) 3222-1234" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="field">
          <label htmlFor="instagram">Instagram (opcional)</label>
          <input id="instagram" autoComplete="off" placeholder="@sualoja" value={form.instagram} onChange={set("instagram")} aria-describedby="ig-help" />
          <small id="ig-help" className="field__help">
            Use @usuario ou cole o link do perfil.
          </small>
        </div>
        <div className="field field--wide">
          <label htmlFor="description">Descrição da loja (aparece no Google)</label>
          <textarea id="description" rows={3} maxLength={300} value={form.description} onChange={set("description")} />
        </div>
        <div className="admin-form__actions">
          <button type="submit" className="btn btn--tinta" disabled={sending}>
            {sending ? "Salvando…" : "Salvar configurações"}
          </button>
          {saved.whatsapp && (
            <a className="btn btn--outline" href={`https://wa.me/${saved.whatsapp}`} target="_blank" rel="noopener noreferrer">
              Testar o WhatsApp
            </a>
          )}
        </div>
      </form>

      <p role={message?.kind === "error" ? "alert" : "status"} className={`admin-msg${message ? ` admin-msg--${message.kind}` : ""}`}>
        {message?.text}
      </p>
    </section>
  );
}
