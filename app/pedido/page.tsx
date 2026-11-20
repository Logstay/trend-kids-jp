import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { OrderTracking } from "@/components/OrderTracking";
import { parseCodeParam } from "@/lib/order-tracking";

export const metadata: Metadata = { title: "Acompanhar pedido — Trend Kids JP", robots: { index: false, follow: false } };

export default async function Pedido({ searchParams }: { searchParams: Promise<{ codigo?: string | string[] }> }) {
  const code = parseCodeParam((await searchParams).codigo);
  return (
    <>
      <Header />
      <main className="container" style={{ paddingBlock: "48px 96px", display: "grid", gap: 24 }}>
        <h1 className="display h2">Acompanhar pedido</h1>
        <OrderTracking initialCode={code} />
      </main>
      <Footer />
    </>
  );
}
