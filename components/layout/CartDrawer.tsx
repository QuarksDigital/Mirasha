"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { useCart } from "@/components/providers/CartProvider";
import { formatPrice } from "@/lib/format";
import QuantityStepper from "@/components/product/QuantityStepper";

const FREE_SHIPPING_ABOVE = 499;

export default function CartDrawer() {
  const { items, isOpen, close, subtotal, setQuantity, remove } = useCart();
  const lenis = useLenis();

  useEffect(() => {
    if (isOpen) lenis?.stop();
    else lenis?.start();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, lenis, close]);

  const remaining = Math.max(0, FREE_SHIPPING_ABOVE - subtotal);

  return (
    <div className={`fixed inset-0 z-[60] ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-paper shadow-2xl transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <p className="text-2xl font-semibold tracking-tight">Your cart</p>
          <button type="button" onClick={close} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-bone text-muted hover:text-ink">
            ✕
          </button>
        </div>

        {items.length > 0 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted">
              {remaining > 0 ? `Add ${formatPrice(remaining)} more for free delivery.` : "You've got free delivery."}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-bone">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_ABOVE) * 100)}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6" data-lenis-prevent>
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <p className="text-xl font-semibold">Your cart is empty.</p>
              <Link href="/shop" onClick={close} className="btn btn-brand">
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line/70">
              {items.map((item) => (
                <li key={item.sku} className="flex gap-4 py-5">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-bone">
                    <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <Link href={`/products/${item.slug}`} onClick={close} className="font-medium leading-snug hover:underline">
                        {item.name}
                      </Link>
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <p className="text-sm text-muted">{item.label}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <QuantityStepper value={item.quantity} onChange={(q) => setQuantity(item.sku, q)} small />
                      <button type="button" onClick={() => remove(item.sku)} className="text-sm text-brand hover:underline">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-line/70 px-6 py-5">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="text-xl font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <Link href="/checkout" onClick={close} className="btn btn-brand w-full">
              Check out
            </Link>
            <Link href="/cart" onClick={close} className="mt-3 block text-center text-sm text-brand hover:underline">
              View cart
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
