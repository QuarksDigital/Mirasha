"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

// Featured first, then most-reviewed.
const byFeatured = (a: Product, b: Product) => Number(b.isFeatured) - Number(a.isFeatured) || b.reviewCount - a.reviewCount;

export default function ShopGrid({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          !needle ||
          [p.name, p.tagline, p.form, p.sanskritName ?? "", ...p.tags, ...p.keyIngredients.map((i) => i.name)].some((s) =>
            s.toLowerCase().includes(needle)
          )
      )
      .sort(byFeatured);
  }, [products, q]);

  return (
    <div className="container-x pb-32">
      <div className="sticky top-24 z-20 -mx-5 border-b border-line/60 bg-white/85 px-5 py-4 backdrop-blur-xl touch-solid md:-mx-8 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <p className="hidden text-sm text-muted sm:block">
            {visible.length} of {products.length} products
          </p>
          <div className="relative w-full sm:w-80">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, combos, ingredients"
              aria-label="Search products"
              type="search"
              className="field !h-11 !rounded-full !pl-10"
            />
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-24 text-center text-xl text-muted">No products match “{q}”.</p>
      ) : (
        <div className="product-grid pt-10 md:pt-12 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
