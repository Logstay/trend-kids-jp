"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { ApiError, adminRequest, parsePriceToCents, putBodyFrom } from "@/lib/admin";
import { EmptyState } from "@/components/EmptyState";
import { AdminNav } from "./AdminNav";
import { formatPrice, type ApiProduct } from "@/lib/api";
import { MAX_IMAGES, imageSrc, removeProductImage, uploadProductImages, validateImageFile } from "@/lib/media";

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
  const [preview, setPreview] = useState<string | null>(null);

  // Libera a memória da pré-visualização quando ela troca ou o componente sai.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

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
    const picked = form.get("image");
    const file = picked instanceof File && picked.size > 0 ? picked : null;
    if (file) {
      const problem = validateImageFile(file);
      if (problem) {
        setMessage({ kind: "error", text: problem });
        return;
      }
    }

    setBusy("create");
    setMessage(null);
    try {
      const created = await adminRequest<ApiProduct>("POST", "/v1/admin/products", {
        name: form.get("name")?.toString().trim(),
        category: form.get("category"),
        description: form.get("description")?.toString().trim() ?? "",
        price_cents: price,
        stock,
      });

      let result: Message = { kind: "ok", text: "Produto criado." };
      if (file) {
        // O produto já existe. Se só a foto falhar, o produto NÃO se perde: avisa e a foto pode ser reenviada pela lista.
        const out = await uploadProductImages(created.id, [file]);
        if (out.unauthorized) {
          router.replace("/admin/login");
          return;
        }
        result = out.failed.length === 0
          ? { kind: "ok", text: "Produto criado com foto." }
          : { kind: "error", text: `Produto criado, mas a foto não foi enviada: ${out.failed[0].message}. Use "Adicionar foto" na lista.` };
      }
      setMessage(result);
      createForm.current?.reset();
      setPreview(null);
      startTransition(() => router.refresh());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/admin/login");
        return;
      }
      setMessage({ kind: "error", text: err instanceof ApiError ? err.message : "Algo deu errado. Tente novamente." });
    } finally {
      setBusy(null);
    }
  }

  /** Escolheu uma foto no formulário de novo produto: confere e mostra a pré-visualização. */
  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    const problem = validateImageFile(file);
    if (problem) {
      setMessage({ kind: "error", text: problem });
      e.target.value = "";
      setPreview(null);
      return;
    }
    setMessage(null);
    setPreview(URL.createObjectURL(file));
  }

  /** Trocar/enviar a foto de um produto que já existe. */
  async function handleReplaceImage(e: ChangeEvent<HTMLInputElement>, p: ApiProduct) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite escolher o mesmo arquivo de novo depois
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      setMessage({ kind: "error", text: problem });
      return;
    }
    await run(
      p.id,
      async () => {
        const out = await uploadProductImages(p.id, [file]);
        if (out.unauthorized) throw new ApiError(401, "Sessão expirada.");
        if (out.failed.length > 0) throw new ApiError(400, out.failed[0].message);
      },
      "Foto adicionada.",
    );
  }

  function removeImage(p: ApiProduct) {
    // Provisório até a tela da galeria: remove a capa (a primeira foto); a seguinte passa a ser a capa.
    return run(p.id, () => removeProductImage(p.id, p.images[0].key), "Capa removida.");
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

      <AdminNav current="produtos" />

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
          <div className="field field--wide">
            <label htmlFor="image">Foto do produto</label>
            <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePick} aria-describedby="image-help" />
            <small id="image-help" className="field__help">
              JPEG, PNG ou WebP, até 5 MB. Sem foto, o produto aparece na loja com um bloco rosa no lugar.
            </small>
            {preview && <img className="photo-preview" src={preview} alt="Pré-visualização da foto escolhida" />}
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
        {products.length === 0 && (
          <EmptyState as="h3" title="Nenhum produto cadastrado">
            Use o formulário acima para cadastrar o primeiro. Assim que ele for criado, a loja já mostra.
          </EmptyState>
        )}

        <ul className="admin-list">
          {products.map((p) => (
            <li key={p.id} className="admin-row admin-row--product">
              <div className="admin-thumb">
                {imageSrc(p.image) ? <img src={imageSrc(p.image)} alt={`Foto de ${p.name}`} loading="lazy" /> : <span>Sem foto</span>}
              </div>
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

              <div className="admin-row__actions">
                <label className="link-btn file-btn">
                  {p.images.length > 0 ? "Adicionar foto" : "Enviar foto"}
                  <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={busy === p.id || p.images.length >= MAX_IMAGES} onChange={(e) => handleReplaceImage(e, p)} />
                </label>
                {p.images.length > 0 && (
                  <button type="button" className="link-btn" disabled={busy === p.id} onClick={() => removeImage(p)}>
                    Remover capa
                  </button>
                )}
              </div>

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
