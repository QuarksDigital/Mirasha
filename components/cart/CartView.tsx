"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import QuantityStepper from "@/components/product/QuantityStepper";
import { formatPrice } from "@/lib/format";
import { useQuote } from "./useQuote";
import OrderSummary from "./OrderSummary";

export default function CartView() {
  const { items, setQuantity, remove, ready } = useCart();
  const { quote, error } = useQuote(items);

  if (!ready) return <p className="mt-10 text-muted">Loading…</p>;

  if (items.length === 0) {
    return (
      <div className="mt-10">
        <p className="text-xl text-muted">Your cart is empty.</p>
        <Link href="/shop" className="btn btn-brand mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-20">
      <ul className="divide-y divide-line/70 border-y border-line/70">
        {items.map((item) => (
          <li key={item.sku} className="flex gap-5 py-8 md:gap-8">
            <Link href={`/products/${item.slug}`} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl bg-bone md:h-36 md:w-36">
              <Image src={item.image} alt={item.name} fill sizes="144px" className="object-cover" />
            </Link>
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between gap-4">
                <div>
                  <Link href={`/products/${item.slug}`} className="text-lg font-semibold tracking-tight hover:underline md:text-xl">
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{item.label}</p>
                </div>
                <p className="text-lg font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
              <div className="mt-auto flex items-center gap-6 pt-4">
                <QuantityStepper value={item.quantity} onChange={(q) => setQuantity(item.sku, q)} small />
                <button type="button" onClick={() => remove(item.sku)} className="text-sm text-brand hover:underline">
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <OrderSummary quote={quote} error={error}>
        <Link href="/checkout" className="btn btn-brand mt-6 w-full">
          Check out
        </Link>
      </OrderSummary>
    </div>
  );
}
