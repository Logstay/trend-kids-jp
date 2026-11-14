"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { ApiError, adminRequest, parsePriceToCents, putBodyFrom } from "@/lib/admin";
import { formatPrice, type ApiProduct } from "@/lib/api";

const CATEGORIES = ["Classic", "Com luz", "Sandálias", "Forrados", "Charms"] as const;
const REASONS = ["Reposição", "Venda no balcão", "Devolução", "Correção de contagem", "Perda ou avaria"] as const;

type Message = { kind: "ok" | "error"; text: string };

export function AdminProducts({ products }: { products: ApiProduct[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const createForm = useRef<HTMLFormElement>(null);

  /** Executa uma ação da API: trata sessão expirada, mostra o resultado e recarrega a lista. */
  async function run(key: string, action: () => Promise<unknown>, okText: string): Promise<boolean> {
    setBusy(key);
    setMessage(null);
    try {
      await action();
      setMessage({ kind: "ok", text: okText });
      startTransition(() => router.refresh());
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
    const form = new FormData(e.currentTarget);
    const price = parsePriceToCents(form.get("price")?.toString() ?? "");
    if (price === null) {
      setMessage({ kind: "error", text: "Preço inválido. Exemplo: 189,90" });
      return;
    }
    const stock = Number(form.get("stock") || 0);
    if (!Number.isInteger(stock) || stock < 0) {
      setMessage({ kind: "error", text: "Estoque inicial deve ser um número inteiro, zero ou mais." });
      return;
    }
    const ok = await run(
      "create",
      () =>
        adminRequest("POST", "/v1/admin/products", {
          name: form.get("name")?.toString().trim(),
          category: form.get("category"),
          description: form.get("description")?.toString().trim() ?? "",
          price_cents: price,
          stock,
        }),
      "Produto criado.",
    );
    if (ok) createForm.current?.reset();
  }

  function toggleActive(p: ApiProduct) {
    return run(p.id, () => adminRequest("PUT", `/v1/admin/products/${p.id}`, putBodyFrom(p, { active: !p.active })), p.active ? "Produto ocultado da loja." : "Produto de volta à loja.");
  }

  async function handleAdjust(e: FormEvent<HTMLFormElement>, p: ApiProduct) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const qty = Number(form.get("qty"));
    if (!Number.isInteger(qty) || qty < 1) {
      setMessage({ kind: "error", text: "A quantidade deve ser um número inteiro, 1 ou mais." });
      return;
    }
    const delta = form.get("direction") === "out" ? -qty : qty;
    const ok = await run(p.id, () => adminRequest("PATCH", `/v1/admin/products/${p.id}/stock`, { delta, reason: form.get("reason") }), "Estoque atualizado.");
    if (ok) setAdjusting(null);
  }

  async function logout() {
    await adminRequest("POST", "/v1/admin/logout").catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <>
      <div className="admin__bar">
        <div>
          <span className="pill pill--rosa">Painel</span>
          <h1 className="display h2">Produtos</h1>
        </div>
        <button type="button" className="btn btn--outline" onClick={logout}>
          Sair
        </button>
      </div>

      <p role={message?.kind === "error" ? "alert" : "status"} className={`admin-msg${message ? ` admin-msg--${message.kind}` : ""}`}>
        {message?.text}
      </p>

      <section className="admin-panel" aria-labelledby="novo">
        <h2 id="novo" className="admin-panel__title">
          Novo produto
        </h2>
        <form ref={createForm} className="admin-form admin-form--grid" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="name">Nome</label>
            <input id="name" name="name" required maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="category">Categoria</label>
            <select id="category" name="category" required defaultValue="Classic">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="price">Preço (R$)</label>
            <input id="price" name="price" required inputMode="decimal" placeholder="189,90" />
          </div>
          <div className="field">
            <label htmlFor="stock">Estoque inicial</label>
            <input id="stock" name="stock" type="number" min={0} step={1} defaultValue={0} />
          </div>
          <div className="field field--wide">
            <label htmlFor="description">Descrição (opcional)</label>
            <input id="description" name="description" maxLength={500} />
          </div>
          <button type="submit" className="btn btn--tinta" disabled={busy === "create"}>
            {busy === "create" ? "Salvando…" : "Criar produto"}
          </button>
        </form>
      </section>

      <section className="admin-panel" aria-labelledby="lista">
        <h2 id="lista" className="admin-panel__title">
          {products.length} {products.length === 1 ? "produto" : "produtos"}
        </h2>
        {products.length === 0 && <p className="muted">Nenhum produto cadastrado ainda.</p>}

        <ul className="admin-list">
          {products.map((p) => (
            <li key={p.id} className="admin-row">
              <div className="admin-row__main">
                <span className="admin-row__name">{p.name}</span>
                <span className="admin-row__meta">
                  {p.category} · {formatPrice(p.price_cents)}
                </span>
              </div>

              <span className="admin-row__stock" aria-label={`Estoque: ${p.stock}`}>
                {p.stock} em estoque
              </span>

              <button type="button" role="switch" aria-checked={p.active} className="switch" disabled={busy === p.id} onClick={() => toggleActive(p)}>
                {p.active ? "Na loja" : "Oculto"}
              </button>

              <button type="button" className="btn btn--outline" aria-expanded={adjusting === p.id} onClick={() => setAdjusting(adjusting === p.id ? null : p.id)}>
                Ajustar estoque
              </button>

              {adjusting === p.id && (
                <form className="admin-form admin-form--inline" onSubmit={(e) => handleAdjust(e, p)}>
                  <div className="field">
                    <label htmlFor={`dir-${p.id}`}>Movimento</label>
                    <select id={`dir-${p.id}`} name="direction" defaultValue="in">
                      <option value="in">Entrada</option>
                      <option value="out">Saída</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`qty-${p.id}`}>Quantidade</label>
                    <input id={`qty-${p.id}`} name="qty" type="number" min={1} step={1} defaultValue={1} required />
                  </div>
                  <div className="field">
                    <label htmlFor={`why-${p.id}`}>Motivo</label>
                    <select id={`why-${p.id}`} name="reason" defaultValue={REASONS[0]}>
                      {REASONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn--tinta" disabled={busy === p.id}>
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
