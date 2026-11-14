import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart/CartProvider";
import { site } from "@/lib/site";
// Fontes servidas pelo próprio site (sem depender do Google Fonts em runtime nem no build).
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-500.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: `${site.name} — Crocs infantis em João Pessoa`,
  description: site.description,
  openGraph: { title: `${site.name} — Crocs infantis`, description: site.description, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#F0357C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
