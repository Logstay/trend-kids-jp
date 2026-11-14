import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart/CartProvider";
import { SettingsProvider } from "@/components/SettingsProvider";
import { getSettings } from "@/lib/settings";
// Fontes servidas pelo próprio site (sem depender do Google Fonts em runtime nem no build).
import "@fontsource/fraunces/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-500.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSettings();
  return {
    title: `${site.name} — Crocs infantis em ${site.city.split("·")[0].trim()}`,
    description: site.description,
    openGraph: { title: `${site.name} — Crocs infantis`, description: site.description, locale: "pt_BR", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#F0357C" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="pt-BR">
      <body>
        <SettingsProvider value={settings}>
          <CartProvider>{children}</CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
