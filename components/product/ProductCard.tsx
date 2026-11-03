"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { discount, formatPrice } from "@/lib/format";
import { useCart } from "@/components/providers/CartProvider";

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const v = product.variants[0];
  const off = discount(v.price, v.mrp);
  const inStock = v.stock > 0;

  return (
    <article className="group flex h-full flex-col">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[5/6] overflow-hidden rounded-[18px] bg-bone md:rounded-[28px]">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 md:left-4 md:top-4">
          {product.isCombo && <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium text-white md:text-xs">Combo</span>}
          {product.isBestseller && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium backdrop-blur md:text-xs">Bestseller</span>
          )}
        </div>
        {off > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-gold px-2 py-1 text-[10px] font-semibold text-white md:right-4 md:top-4 md:text-xs">
            −{off}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-0.5 pt-3 md:px-1 md:pt-5">
        <p className="text-[11px] font-medium text-gold md:text-xs">{product.form}</p>
        <Link href={`/products/${product.slug}`} className="mt-1 text-[15px] font-semibold leading-snug tracking-tight hover:underline md:text-lg">
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-xs text-muted md:text-sm">{product.tagline}</p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-2 pt-3 md:pt-4">
          <p className="text-sm md:text-[15px]">
            <span className="font-semibold">{formatPrice(v.price)}</span>
            {off > 0 && <span className="ml-1.5 text-xs text-muted line-through md:ml-2 md:text-sm">{formatPrice(v.mrp)}</span>}
          </p>
          <button
            type="button"
            onClick={() =>
              add({ slug: product.slug, sku: v.sku, name: product.name, label: v.label, price: v.price, mrp: v.mrp, image: product.images[0] })
            }
            disabled={!inStock}
            className="rounded-full bg-bone px-3 py-1.5 text-xs font-medium text-brand transition-colors enabled:hover:bg-brand enabled:hover:text-white disabled:text-muted md:px-4 md:py-2 md:text-sm"
            aria-label={inStock ? `Add ${product.name} (${v.label}) to cart` : `${product.name} coming soon`}
          >
            {inStock ? "Add to cart" : "Soon"}
          </button>
        </div>
      </div>
    </article>
  );
}
