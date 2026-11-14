import { Categories } from "@/components/Categories";
import { Featured } from "@/components/Featured";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LandingEmpty } from "@/components/LandingEmpty";
import { getShowcase } from "@/lib/api";
import { Story } from "@/components/Story";
import { Trending } from "@/components/Trending";

export default async function Home() {
  const { items } = await getShowcase(8);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Categories />
        {items.length === 0 ? (
          <LandingEmpty />
        ) : (
          <>
            <Trending products={items.slice(0, 5)} />
            <Featured products={items} />
          </>
        )}
        <Story />
      </main>
      <Footer />
    </>
  );
}
