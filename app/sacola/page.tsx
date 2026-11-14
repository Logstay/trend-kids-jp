import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = { title: "Sacola — Trend Kids JP", robots: { index: false, follow: false } };

export default function Sacola() {
  return (
    <>
      <Header />
      <main className="container" style={{ paddingBlock: "48px 96px", display: "grid", gap: 24 }}>
        <h1 className="display h2">Sacola</h1>
        <CartView />
      </main>
      <Footer />
    </>
  );
}
