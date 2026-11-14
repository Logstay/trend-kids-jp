import { Categories } from "@/components/Categories";
import { Featured } from "@/components/Featured";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Story } from "@/components/Story";
import { Trending } from "@/components/Trending";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Categories />
        <Trending />
        <Featured />
        <Story />
      </main>
      <Footer />
    </>
  );
}
