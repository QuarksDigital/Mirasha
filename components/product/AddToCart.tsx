"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { discount, formatPrice } from "@/lib/format";
import { useCart } from "@/components/providers/CartProvider";
import QuantityStepper from "./QuantityStepper";

export default function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [sku, setSku] = useState(product.variants[0].sku);
  const [qty, setQty] = useState(1);
  const v = product.variants.find((x) => x.sku === sku) ?? product.variants[0];
  const off = discount(v.price, v.mrp);
  const inStock = v.stock > 0;

  return (
    <div>
      {product.variants.length > 1 && (
        <fieldset className="mb-8">
          <legend className="mb-3 text-[15px] font-semibold">Size</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {product.variants.map((x) => (
              <button
                key={x.sku}
                type="button"
                onClick={() => setSku(x.sku)}
                aria-pressed={x.sku === sku}
                className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-colors ${
                  x.sku === sku ? "border-brand ring-1 ring-brand" : "border-line hover:border-muted"
                }`}
              >
                <span className="font-medium">{x.label}</span>
                <span className="text-sm text-muted">{formatPrice(x.price)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-semibold tracking-tight">{formatPrice(v.price)}</p>
        {off > 0 && (
          <>
            <p className="text-muted line-through">{formatPrice(v.mrp)}</p>
            <p className="text-sm font-medium text-gold">Save {off}%</p>
          </>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">Inclusive of all taxes</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <QuantityStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} max={Math.min(20, v.stock)} />
        <button
          type="button"
          disabled={!inStock}
          onClick={() =>
            add(
              { slug: product.slug, sku: v.sku, name: product.name, label: v.label, price: v.price, mrp: v.mrp, image: product.images[0] },
              qty
            )
          }
          className="btn btn-brand h-11 flex-1"
        >
          {inStock ? "Add to cart" : "Out of stock"}
        </button>
      </div>
      <p className="mt-4 text-sm text-muted">
        {inStock ? (v.stock < 50 ? `Only ${v.stock} left. ` : "In stock. ") : "Restocking soon. "}
        Ships within 24 hours · Free delivery over ₹499
      </p>
    </div>
  );
}
