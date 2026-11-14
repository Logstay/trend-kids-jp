"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { revalidateSite } from "@/app/admin/actions";
import { ApiError, apiRequest } from "@/lib/admin";
import { MAX_SELLERS, type AdminSeller } from "@/lib/sellers";
import { EmptyState } from "../EmptyState";

type Message = { kind: "ok" | "error"; text: string };

export function SellersAdmin({ sellers }: { sellers: AdminSeller[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const activeCount = sellers.filter((s) => s.active).length;

  /** Executa uma ação: trata sessão expirada, mostra o resultado e atualiza a lista e o site público. */
  async function run(key: string, action: () => Promise<unknown>, okText: string): Promise<boolean> {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      setMessage({ kind: "ok", text: okText });
      router.refresh();
      revalidateSite().catch(() => undefined); // limpa o cache do site público em segundo plano
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return false;
      }
      setMessage({ kind: "error", text: err instanceof ApiError ? err.message : "Algo deu errado. Tente novamente." });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const ok = await run("create", () => apiRequest("POST", "/v1/admin/sellers", { name: data.get("name"), whatsapp: data.get("whatsapp") }), "Vendedora cadastrada.");
    if (ok) form.reset();
  }

  async function handleEdit(e: FormEvent<HTMLFormElement>, s: AdminSeller) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const ok = await run(s.id, () => apiRequest("PUT", `/v1/admin/sellers/${s.id}`, { name: data.get("name"), whatsapp: data.get("whatsapp"), active: s.active }), "Vendedora atualizada.");
    if (ok) setEditing(null);
  }

  const toggle = (s: AdminSeller) =>
    run(s.id, () => apiRequest("PUT", `/v1/admin/sellers/${s.id}`, { name: s.name, whatsapp: s.whatsapp_display, active: !s.active }), s.active ? "Vendedora desativada: não aparece mais para o cliente." : "Vendedora ativada.");

  async function remove(s: AdminSeller) {
    await run(s.id, () => apiRequest("DELETE", `/v1/admin/sellers/${s.id}`), "Vendedora removida.");
    setConfirmRemove(null);
  }

  return (
    <>
      <section className="admin-panel" aria-labelledby="como">
        <h2 id="como" className="admin-panel__title">
          Como o cliente é levado ao WhatsApp
        </h2>
        <ul className="muted admin-help">
          <li>
            <strong>2 ou mais vendedoras ativas:</strong> o cliente escolhe com quem quer falar.
          </li>
          <li>
            <strong>1 vendedora ativa:</strong> vai direto para ela.
          </li>
          <li>
            <strong>Nenhuma:</strong> vai para o WhatsApp de contato da loja (aba “Contato da loja”).
          </li>
        </ul>
      </section>

      <p role={message?.kind === "error" ? "alert" : "status"} className={`admin-msg${message ? ` admin-msg--${message.kind}` : ""}`}>
        {message?.text}
      </p>

      <section className="admin-panel" aria-labelledby="nova">
        <h2 id="nova" className="admin-panel__title">
          Nova vendedora
        </h2>
        <form className="admin-form admin-form--grid admin-form--top" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="new-name">Nome</label>
            <input id="new-name" name="name" required minLength={2} maxLength={60} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="new-whatsapp">WhatsApp</label>
            <input id="new-whatsapp" name="whatsapp" required inputMode="tel" autoComplete="off" placeholder="(83) 99999-1234" />
          </div>
          <button type="submit" className="btn btn--tinta" disabled={busy === "create" || sellers.length >= MAX_SELLERS}>
            {busy === "create" ? "Salvando…" : "Cadastrar"}
          </button>
        </form>
      </section>

      <section className="admin-panel" aria-labelledby="lista">
        <h2 id="lista" className="admin-panel__title">
          {sellers.length} {sellers.length === 1 ? "vendedora" : "vendedoras"} · {activeCount} {activeCount === 1 ? "ativa" : "ativas"}
        </h2>

        {sellers.length === 0 && (
          <EmptyState as="h3" title="Nenhuma vendedora cadastrada">
            Sem vendedoras, o site leva o cliente ao WhatsApp de contato da loja. Cadastre a primeira no formulário acima.
          </EmptyState>
        )}

        <ul className="admin-list">
          {sellers.map((s) => (
            <li key={s.id} className="admin-row admin-row--seller">
              <div className="admin-row__main">
                <span className="admin-row__name">{s.name}</span>
                <span className="admin-row__meta">{s.whatsapp_display}</span>
              </div>

              <button type="button" role="switch" aria-checked={s.active} className="switch" disabled={busy === s.id} onClick={() => toggle(s)}>
                {s.active ? "Ativa" : "Inativa"}
              </button>

              <a className="btn btn--outline" href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer">
                Testar
              </a>

              <div className="admin-row__actions">
                <button type="button" className="link-btn" aria-expanded={editing === s.id} onClick={() => setEditing(editing === s.id ? null : s.id)}>
                  Editar
                </button>
                {confirmRemove === s.id ? (
                  <>
                    <button type="button" className="link-btn" disabled={busy === s.id} onClick={() => remove(s)}>
                      Confirmar remoção
                    </button>
                    <button type="button" className="link-btn" onClick={() => setConfirmRemove(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button type="button" className="link-btn" onClick={() => setConfirmRemove(s.id)}>
                    Remover
                  </button>
                )}
              </div>

              {editing === s.id && (
                <form className="admin-form admin-form--inline" onSubmit={(e) => handleEdit(e, s)}>
                  <div className="field">
                    <label htmlFor={`n-${s.id}`}>Nome</label>
                    <input id={`n-${s.id}`} name="name" required minLength={2} maxLength={60} defaultValue={s.name} />
                  </div>
                  <div className="field">
                    <label htmlFor={`w-${s.id}`}>WhatsApp</label>
                    <input id={`w-${s.id}`} name="whatsapp" required inputMode="tel" defaultValue={s.whatsapp_display} />
                  </div>
                  <button type="submit" className="btn btn--tinta" disabled={busy === s.id}>
                    Salvar
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
