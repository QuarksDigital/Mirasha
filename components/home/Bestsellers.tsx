import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import type { Product } from "@/lib/types";

export default function Bestsellers({ products }: { products: Product[] }) {
  return (
    <Reveal as="section" className="py-24 md:py-36">
      <div className="container-x">
        <SectionHead
          eyebrow="Bestsellers"
          title="The ones people reorder."
          action={
            <Link href="/shop" className="link text-[17px]">
              Shop all products ›
            </Link>
          }
        />
        {products.length === 0 ? (
          <p className="text-muted">Products unavailable - start the API (backend) and refresh.</p>
        ) : (
          <div className="product-grid lg:grid-cols-4">
            {products.map((p) => (
              <div key={p.slug} data-reveal>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}
