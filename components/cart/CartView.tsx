"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { ApiError, apiRequest } from "@/lib/admin";
import { formatPrice, type ApiOrder } from "@/lib/api";
import { cartCount, subtotalCents, toOrderRequest } from "@/lib/cart";
import { orderMessage } from "@/lib/order-message";
import { formatPhone } from "@/lib/phone-mask";
import { checkoutWhatsAppHref } from "@/lib/sellers";
import { EmptyState } from "../EmptyState";
import { useSellers } from "../SellersProvider";
import { useSettings } from "../SettingsProvider";
import { WhatsAppIcon } from "../icons";
import { useCart } from "./CartProvider";

export function CartView() {
  const { cart, ready, setQty, remove, clear } = useCart();
  const sellers = useSellers();
  const site = useSettings();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ order: ApiOrder; whatsappHref: string | null } | null>(null);
  const [phone, setPhone] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const picker = useRef<HTMLDialogElement>(null);
  const pickerTitle = useId();

  if (placed) return <Confirmation order={placed.order} whatsappHref={placed.whatsappHref} />;
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

  /**
   * Cria o pedido e leva o cliente ao WhatsApp da vendedora `sellerId`.
   * Precisa ser chamada direto de um clique: a aba do WhatsApp só abre (sem bloqueio) dentro do gesto do usuário.
   */
  async function placeOrder(form: HTMLFormElement, sellerId: string) {
    if (sending) return; // evita pedido em duplicidade por duplo clique
    const data = new FormData(form);
    const popup = window.open("", "_blank");
    if (popup) popup.opener = null;

    setSending(true);
    setError("");
    try {
      const order = await apiRequest<ApiOrder>(
        "POST",
        "/v1/orders",
        toOrderRequest(cart, {
          name: data.get("name")?.toString() ?? "",
          phone: data.get("phone")?.toString() ?? "",
          neighborhood: data.get("neighborhood")?.toString() ?? "",
        }),
      );
      clear();
      const href = checkoutWhatsAppHref(sellers, site, orderMessage(order), sellerId);
      const whatsappHref = href.startsWith("https://wa.me/") ? href : null;
      if (popup) {
        if (whatsappHref) popup.location.href = whatsappHref;
        else popup.close();
      }
      setPlaced({ order, whatsappHref });
    } catch (err) {
      popup?.close();
      setError(err instanceof ApiError ? err.message : "Algo deu errado. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  // "Fechar pedido" só dispara o submit depois que os campos obrigatórios estão válidos.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sellers.length >= 2) {
      picker.current?.showModal(); // 2+ vendedoras: o cliente escolhe antes de enviar
      return;
    }
    void placeOrder(e.currentTarget, sellers[0]?.id ?? "");
  }

  function chooseSeller(sellerId: string) {
    picker.current?.close();
    if (formRef.current) void placeOrder(formRef.current, sellerId);
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
        <form ref={formRef} className="admin-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Nome</label>
            <input id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="phone">WhatsApp / telefone com DDD</label>
            <input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="(83) 99999-1234" maxLength={15} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
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

      {/* Escolha de vendedora: só aparece com 2+ cadastradas. <dialog> nativo cuida do foco, do Esc e do fundo. */}
      <dialog
        ref={picker}
        className="picker"
        aria-labelledby={pickerTitle}
        onClick={(e) => {
          if (e.target === picker.current) picker.current?.close(); // clique no fundo escurecido
        }}
      >
        <div className="picker__box">
          <h2 id={pickerTitle} className="display picker__title">
            Com quem você quer falar?
          </h2>
          <p className="muted">Escolha uma vendedora. O seu pedido vai direto para o WhatsApp dela.</p>
          <ul className="picker__list">
            {sellers.map((s) => (
              <li key={s.id}>
                <button type="button" className="picker__item" onClick={() => chooseSeller(s.id)}>
                  <span className="picker__name">{s.name}</span>
                  <span className="picker__num">{s.whatsapp_display}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--outline" onClick={() => picker.current?.close()}>
            Cancelar
          </button>
        </div>
      </dialog>
    </div>
  );
}

function Confirmation({ order, whatsappHref }: { order: ApiOrder; whatsappHref: string | null }) {
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
        {whatsappHref ? (
          <>
            <p className="muted">O WhatsApp abriu em outra aba com o seu pedido. Se não abriu, use o botão abaixo.</p>
            <a href={whatsappHref} className="btn btn--lg btn--tinta" target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Abrir o WhatsApp com o pedido
            </a>
          </>
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
