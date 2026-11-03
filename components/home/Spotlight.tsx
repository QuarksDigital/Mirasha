import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export default function Spotlight({ product }: { product?: Product }) {
  if (!product) return null;
  const v = product.variants[0];
  return (
    <Reveal as="section" className="py-24 md:py-36">
      <div className="container-x">
        <div className="grid items-center gap-10 overflow-hidden rounded-[36px] bg-bone p-6 md:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <div className="lg:pl-4">
            <p data-reveal className="eyebrow">
              Featured
            </p>
            <h2 data-reveal className="headline mt-3 text-4xl md:text-6xl">
              {product.name}
            </h2>
            <p data-reveal className="mt-5 max-w-md text-lg leading-relaxed text-muted">
              {product.description}
            </p>
            <div data-reveal className="mt-8 flex flex-wrap items-center gap-6">
              <Link href={`/products/${product.slug}`} className="btn btn-brand">
                Buy · {formatPrice(v.price)}
              </Link>
              <Link href={`/products/${product.slug}`} className="link text-[17px]">
                Learn more ›
              </Link>
            </div>
          </div>
          <div data-reveal className="relative aspect-[5/6] overflow-hidden rounded-[28px] bg-white">
            <Image src={product.images[0]} alt={product.name} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-contain p-8 md:p-12" />
          </div>
        </div>
      </div>
    </Reveal>
  );
}
