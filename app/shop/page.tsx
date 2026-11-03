import type { Metadata } from "next";
import ShopGrid from "@/components/shop/ShopGrid";
import { getProducts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Shop Mirasha's Ayurvedic and modern wellness range and money-saving combos: Shilajit, collagen, magnesium, vitamin B12, apple cider vinegar and more.",
};

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="pt-24">
      <header className="container-x pb-8 pt-14 md:pb-10 md:pt-20">
        <h1 className="headline text-5xl md:text-7xl">Shop.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted md:text-xl">
          {products.filter((p) => !p.isCombo).length} formulations and {products.filter((p) => p.isCombo).length} combos.
        </p>
      </header>
      <ShopGrid products={products} />
    </div>
  );
}
