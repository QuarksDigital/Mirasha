"use client";

import { useEffect, useState } from "react";
import { postJSON } from "@/lib/client-api";
import type { CartItem, Quote } from "@/lib/types";

type State = { key: string; quote: Quote | null; error: string | null; couponError: string | null };

/**
 * Server-side price check for the cart — totals shown to the user always come from the API.
 * If a coupon is rejected, the cart is re-priced without it and the reason is returned as couponError.
 */
export function useQuote(items: CartItem[], couponCode = "") {
  const lines = items.map(({ slug, sku, quantity }) => ({ slug, sku, quantity }));
  const key = `${items.map((i) => `${i.sku}:${i.quantity}`).join(",")}|${couponCode}`;
  const [result, setResult] = useState<State>({ key: "", quote: null, error: null, couponError: null });

  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    (async () => {
      try {
        const quote = await postJSON<Quote>("/cart/quote", { items: lines, couponCode: couponCode || undefined });
        if (!cancelled) setResult({ key, quote, error: null, couponError: null });
      } catch (e) {
        if (!couponCode) {
          if (!cancelled) setResult({ key, quote: null, error: (e as Error).message, couponError: null });
          return;
        }
        try {
          const quote = await postJSON<Quote>("/cart/quote", { items: lines });
          if (!cancelled) setResult({ key, quote, error: null, couponError: (e as Error).message });
        } catch (e2) {
          if (!cancelled) setResult({ key, quote: null, error: (e2 as Error).message, couponError: null });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures every field that affects the quote
  }, [key]);

  // Ignore a stale response while the next one is in flight
  const fresh = result.key === key;
  return { quote: fresh ? result.quote : null, error: fresh ? result.error : null, couponError: fresh ? result.couponError : null };
}
