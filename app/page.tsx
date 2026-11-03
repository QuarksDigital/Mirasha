import Hero from "@/components/hero/Hero";
import TrustBar from "@/components/home/TrustBar";
import Bestsellers from "@/components/home/Bestsellers";
import OffersSection from "@/components/home/OffersSection";
import Spotlight from "@/components/home/Spotlight";
import Concerns from "@/components/home/Concerns";
import Process from "@/components/home/Process";
import Doshas from "@/components/home/Doshas";
import Stats from "@/components/home/Stats";
import TrustedTrails from "@/components/home/TrustedTrails";
import JournalTeaser from "@/components/home/JournalTeaser";
import Newsletter from "@/components/home/Newsletter";
import { getCategories, getProducts } from "@/lib/api";

export default async function Home() {
  const [bestsellers, categories, all] = await Promise.all([
    getProducts({ bestseller: "true", limit: "4" }),
    getCategories(),
    getProducts(),
  ]);
  const spotlight = all.find((p) => p.slug === "shilajit-resin") ?? all[0];

  return (
    <>
      <Hero />
      <TrustBar />
      <Bestsellers products={bestsellers} />
      <OffersSection />
      <Spotlight product={spotlight} />
      <Concerns categories={categories} />
      <Process />
      <Stats />
      <Doshas />
      <TrustedTrails />
      <JournalTeaser />
      <Newsletter />
    </>
  );
}
