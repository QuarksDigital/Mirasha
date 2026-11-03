import type { Metadata } from "next";
import ProductCard from "@/components/product/ProductCard";
import CopyCode from "@/components/ui/CopyCode";
import { getOffers, getProducts } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Offers & combos",
  description: "Current Mirasha offers, coupon codes and money-saving wellness combos.",
};

export default async function OffersPage() {
  const [offers, combos] = await Promise.all([getOffers(), getProducts({ combos: "true" })]);
  const maxSaving = combos.reduce((m, p) => Math.max(m, p.variants[0].mrp - p.variants[0].price), 0);

  return (
    <div className="pt-24">
      <header className="container-x pb-12 pt-14 md:pt-20">
        <p className="eyebrow">Offers</p>
        <h1 className="headline mt-3 text-5xl md:text-7xl">Offers & combos.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted md:text-xl">
          Apply a code at checkout, or save up to {formatPrice(maxSaving)} with a combo.
        </p>
      </header>

      <section className="container-x">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <li key={o._id ?? o.title} className="flex min-h-40 flex-col justify-between rounded-[28px] bg-bone p-7 md:p-8">
              <div>
                <p className="text-xl font-semibold leading-snug tracking-tight">{o.title}</p>
                {o.detail && <p className="mt-2 text-sm text-muted">{o.detail}</p>}
              </div>
              <div className="mt-6">{o.code ? <CopyCode code={o.code} /> : <span className="text-sm font-medium text-gold">Applied automatically</span>}</div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-muted">One coupon per order. Offers may change without notice.</p>
      </section>

      <section className="container-x pb-32 pt-24">
        <h2 className="headline mb-10 text-4xl md:text-5xl">Combos</h2>
        <div className="product-grid lg:grid-cols-4">
          {combos.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
