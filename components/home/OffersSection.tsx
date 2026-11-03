import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import CopyCode from "@/components/ui/CopyCode";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import { getOffers, getProducts } from "@/lib/api";

export default async function OffersSection() {
  const [offers, combos] = await Promise.all([getOffers(), getProducts({ combos: "true" })]);
  const featured = offers.slice(0, 3);

  return (
    <Reveal as="section" id="offers" className="scroll-mt-24 py-24 md:py-36">
      <div className="container-x">
        <SectionHead
          eyebrow="Offers"
          title="More wellness, for less."
          subtitle="Current offers and money-saving combos, curated for every goal."
          action={
            <Link href="/offers" className="link text-[17px]">
              See all offers ›
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((o, i) => (
            <div
              key={o._id ?? o.title}
              data-reveal
              className={`flex min-h-44 flex-col justify-between rounded-[28px] p-7 md:p-8 ${i === 0 ? "bg-brand text-white" : "bg-bone"}`}
            >
              <div>
                <p className={`text-xl font-semibold leading-snug tracking-tight md:text-2xl ${i === 0 ? "text-[#f3e7c8]" : ""}`}>{o.title}</p>
                {o.detail && <p className={`mt-2 text-sm ${i === 0 ? "text-white/70" : "text-muted"}`}>{o.detail}</p>}
              </div>
              <div className="mt-6">{o.code ? <CopyCode code={o.code} tone={i === 0 ? "dark" : "light"} /> : <span className={`text-sm font-medium ${i === 0 ? "text-[#c9a45c]" : "text-gold"}`}>Applied automatically</span>}</div>
            </div>
          ))}
        </div>

        {combos.length > 0 && (
          <>
            <h3 data-reveal className="headline mb-8 mt-20 text-3xl md:text-4xl">
              Combos
            </h3>
            <div className="product-grid lg:grid-cols-4">
              {combos.slice(0, 4).map((p) => (
                <div key={p.slug} data-reveal>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Reveal>
  );
}
