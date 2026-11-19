import { Categories } from "@/components/Categories";
import { Featured } from "@/components/Featured";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LandingEmpty } from "@/components/LandingEmpty";
import { fromPriceLabel, getShowcase } from "@/lib/api";
import { listView, showsCategories } from "@/lib/empty";
import { launchesHref, pickHeroProduct, showsCollections, showsTrending } from "@/lib/landing";
import { Story } from "@/components/Story";
import { Trending } from "@/components/Trending";

export default async function Home() {
  const { items, source } = await getShowcase(8);
  const view = listView(source === "error" ? null : items, false);
  // A página é dinâmica (getShowcase não usa cache), então o sorteio roda a cada carregamento, no servidor.
  // Math.random é seguro aqui: não há renderização estática nem hidratação que precise do mesmo valor.
  const hero = source === "error" ? null : pickHeroProduct(items, Math.random);

  return (
    <>
      <Header />
      <main>
        <Hero
          fromPrice={source === "api" ? fromPriceLabel(items) : null} product={hero}
          launchesHref={launchesHref(source === "error" ? 0 : items.length)}
        />
        {showsCategories(view) && showsCollections(items.length) && <Categories />}
        {source === "error" ? (
          <LandingEmpty reason="error" />
        ) : items.length === 0 ? (
          <LandingEmpty reason="empty" />
        ) : (
          <>
            {showsTrending(items.length) && <Trending products={items.slice(0, 5)} />}
            <Featured products={items} />
          </>
        )}
        <Story />
      </main>
      <Footer />
    </>
  );
}
