"use client";

import { useState, type FormEvent } from "react";
import { formatPrice, type ApiOrder } from "@/lib/api";
import { ApiError } from "@/lib/admin";
import { isValidOrderCode, lookupOrder, normalizeOrderCode, orderProgress, orderStatusLabel, orderSteps } from "@/lib/order-tracking";

const INVALID_CODE = "Código no formato TK… (são 10 caracteres)";
const GENERIC_ERROR = "Não conseguimos consultar agora. Tente de novo.";

export function OrderTracking({ initialCode }: { initialCode: string }) {
  const [code, setCode] = useState(initialCode);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search() {
    if (loading) return;
    if (!isValidOrderCode(normalizeOrderCode(code))) {
      setOrder(null);
      setError(INVALID_CODE);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setOrder(await lookupOrder(code, phone));
    } catch (err) {
      setOrder(null);
      setError(err instanceof ApiError ? err.message : GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void search();
  }

  const progress = order ? orderProgress(order.status) : -1;
  const cancelled = order?.status === "cancelled";

  return (
    <div className="tracking">
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="code">Código do pedido</label>
          <input id="code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" maxLength={12} />
        </div>
        <div className="field">
          <label htmlFor="phone">WhatsApp / telefone com DDD</label>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button type="submit" className="btn btn--lg btn--tinta" disabled={loading}>
          {loading ? "Consultando…" : "Consultar pedido"}
        </button>
      </form>

      {error && (
        <div role="alert" className="tracking__error">
          <p className="admin-error">{error}</p>
          {error !== INVALID_CODE && (
            <button type="button" className="btn btn--outline" onClick={() => void search()} disabled={loading}>
              Tentar de novo
            </button>
          )}
        </div>
      )}

      {order && (
        <section aria-labelledby="pedido-status" className="admin-panel tracking__result" aria-live="polite">
          <h2 id="pedido-status" className="h3">Pedido {order.code}</h2>
          <p className="tracking__status"><strong>{orderStatusLabel(order.status)}</strong></p>
          {!cancelled && (
            <ol className="tracking__steps">
              {orderSteps.map((step, i) => (
                <li
                  key={step.status}
                  className={`tracking__step${i <= progress ? " tracking__step--done" : ""}${i === progress ? " tracking__step--current" : ""}`}
                  aria-current={i === progress ? "step" : undefined}
                >
                  {step.label}
                </li>
              ))}
            </ol>
          )}
          <ul className="tracking__items">
            {order.items.map((item, index) => (
              <li key={`${item.product_id}-${index}`}>
                {item.quantity}x {item.name} <span>{formatPrice(item.total_cents)}</span>
              </li>
            ))}
          </ul>
          <dl className="tracking__totals">
            <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal_cents)}</dd></div>
            {order.shipping_cents > 0 && <div><dt>Frete</dt><dd>{formatPrice(order.shipping_cents)}</dd></div>}
            <div><dt>Total</dt><dd><strong>{formatPrice(order.total_cents)}</strong></dd></div>
          </dl>
        </section>
      )}
    </div>
  );
}
