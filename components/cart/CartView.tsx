"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/admin";
import { formatPrice, type ApiOrder } from "@/lib/api";
import { cartCount, subtotalCents, toOrderRequest } from "@/lib/cart";
import { orderMessage } from "@/lib/order-message";
import { hasWhatsApp, whatsappHref } from "@/lib/settings";
import { EmptyState } from "../EmptyState";
import { useSettings } from "../SettingsProvider";
import { WhatsAppIcon } from "../icons";
import { useCart } from "./CartProvider";

export function CartView() {
  const { cart, ready, setQty, remove, clear } = useCart();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<ApiOrder | null>(null);

  if (placed) return <Confirmation order={placed} />;
  if (!ready) return <p className="muted" aria-busy="true">Carregando sua sacola…</p>;

  if (cart.items.length === 0) {
    return (
      <EmptyState eyebrow="Sacola" title="Sua sacola está vazia"
        actions={
          <Link href="/loja" className="btn btn--tinta">
            Ver a loja
          </Link>
        }
      >
        Escolha os pares do seu pequeno e eles aparecem aqui.
      </EmptyState>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return; // evita pedido em duplicidade por duplo clique
    const form = new FormData(e.currentTarget);
    setSending(true);
    setError("");
    try {
      const order = await apiRequest<ApiOrder>(
        "POST",
        "/v1/orders",
        toOrderRequest(cart, {
          name: form.get("name")?.toString() ?? "",
          phone: form.get("phone")?.toString() ?? "",
          neighborhood: form.get("neighborhood")?.toString() ?? "",
        }),
      );
      clear();
      setPlaced(order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Algo deu errado. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="cart">
      <section aria-labelledby="itens" className="cart__items">
        <h2 id="itens" className="admin-panel__title">
          {cartCount(cart)} {cartCount(cart) === 1 ? "item" : "itens"}
        </h2>
        <ul className="admin-list">
          {cart.items.map((i) => (
            <li key={i.id} className="cart-row">
              <div className="admin-row__main">
                <span className="admin-row__name">{i.name}</span>
                <span className="admin-row__meta">{formatPrice(i.priceCents)} cada</span>
              </div>
              <div className="qty" role="group" aria-label={`Quantidade de ${i.name}`}>
                <button type="button" className="qty__btn" aria-label={`Diminuir ${i.name}`} onClick={() => setQty(i.id, i.qty - 1)}>
                  −
                </button>
                <span className="qty__n" aria-live="polite">
                  {i.qty}
                </span>
                <button type="button" className="qty__btn" aria-label={`Aumentar ${i.name}`} disabled={i.qty >= Math.min(20, i.stock)} onClick={() => setQty(i.id, i.qty + 1)}>
                  +
                </button>
              </div>
              <span className="cart-row__total">{formatPrice(i.priceCents * i.qty)}</span>
              <button type="button" className="link-btn" onClick={() => remove(i.id)} aria-label={`Remover ${i.name}`}>
                Remover
              </button>
            </li>
          ))}
        </ul>
        <p className="muted">
          Subtotal: <strong>{formatPrice(subtotalCents(cart))}</strong>. Frete e total final são confirmados ao fechar o pedido.
        </p>
      </section>

      <section aria-labelledby="dados" className="admin-panel">
        <h2 id="dados" className="admin-panel__title">
          Seus dados
        </h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Nome</label>
            <input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="phone">WhatsApp / telefone com DDD</label>
            <input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="(83) 99999-1234" />
          </div>
          <div className="field">
            <label htmlFor="neighborhood">Bairro</label>
            <input id="neighborhood" name="neighborhood" required minLength={2} maxLength={80} autoComplete="address-level3" />
          </div>
          <button type="submit" className="btn btn--lg btn--tinta" disabled={sending}>
            {sending ? "Enviando pedido…" : "Fechar pedido"}
          </button>
          <p role="alert" className="admin-error">
            {error}
          </p>
        </form>
      </section>
    </div>
  );
}

function Confirmation({ order }: { order: ApiOrder }) {
  const site = useSettings();

  return (
    <div className="admin-panel confirm">
      <span className="pill pill--azul">Pedido recebido</span>
      <h2 className="display h2">Recebemos o seu pedido!</h2>
      <p className="muted">
        Seu código é <strong className="confirm__code">{order.code}</strong>. Guarde: a loja usa esse código para falar com você sobre o pedido.
      </p>

      <ul className="admin-list">
        {order.items.map((i) => (
          <li key={i.product_id} className="confirm__row">
            <span>
              {i.quantity}x {i.name}
            </span>
            <span>{formatPrice(i.total_cents)}</span>
          </li>
        ))}
      </ul>
      <p className="confirm__total">
        {order.shipping_cents > 0 && <span className="muted">Frete: {formatPrice(order.shipping_cents)} · </span>}
        Total: <strong>{formatPrice(order.total_cents)}</strong>
      </p>

      <div className="hero__ctas">
        {hasWhatsApp(site) ? (
          <a href={whatsappHref(site, orderMessage(order))} className="btn btn--lg btn--tinta">
            <WhatsAppIcon /> Enviar pedido pelo WhatsApp
          </a>
        ) : (
          <p className="muted">A loja vai entrar em contato pelo telefone que você informou para combinar pagamento e entrega.</p>
        )}
        <Link href="/loja" className="btn btn--lg btn--creme">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
