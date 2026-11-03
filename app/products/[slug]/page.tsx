import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AddToCart from "@/components/product/AddToCart";
import ProductCard from "@/components/product/ProductCard";
import { getProduct, getProducts } from "@/lib/api";
import { CATEGORY_NAMES } from "@/lib/format";

export async function generateStaticParams() {
  const products = await getProducts();
  // Cache Components requires at least one param; the placeholder renders a 404.
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) return { title: "Product not found" };
  return { title: data.product.name, description: `${data.product.tagline}. ${data.product.description.slice(0, 140)}` };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-x grid gap-12 pt-28 lg:grid-cols-2" aria-busy>
      <div className="aspect-[5/6] animate-pulse rounded-[36px] bg-bone" />
      <div className="space-y-4 pt-6">
        <div className="h-4 w-32 animate-pulse rounded bg-bone" />
        <div className="h-12 w-3/4 animate-pulse rounded bg-bone" />
        <div className="h-6 w-1/2 animate-pulse rounded bg-bone" />
      </div>
    </div>
  );
}

async function ProductDetails({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const data = await getProduct(slug);
  if (!data) notFound();
  const { product: p, related } = data;

  const facts = [
    ["Form", p.form],
    ["Dosage", p.dosage],
    ["Balances", p.doshas.join(", ")],
    ["Shelf life", p.shelfLife],
    ["Storage", p.storage],
    ["Manufacturer", p.manufacturer],
    ["Country of origin", p.countryOfOrigin],
    ["Licence", p.ayushLicense],
  ].filter(([, v]) => v);

  return (
    <div className="pt-24">
      <div className="container-x">
        <nav className="flex flex-wrap gap-1.5 pt-6 text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          <span>›</span>
          <Link href={`/shop?category=${p.category}`} className="hover:text-ink">{CATEGORY_NAMES[p.category]}</Link>
        </nav>

        <section className="grid gap-10 pt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[5/6] overflow-hidden rounded-[36px] bg-bone">
              <Image src={p.images[0]} alt={p.name} fill preload sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            </div>
          </div>

          <div className="pb-8">
            {p.isBestseller && <p className="eyebrow">Bestseller</p>}
            <h1 className="headline mt-2 text-4xl md:text-5xl">{p.name}</h1>
            <p className="mt-3 text-xl text-muted">{p.tagline}</p>
            {p.reviewCount > 0 && (
              <p className="mt-4 text-sm text-muted">
                <span className="text-ink">★ {p.rating.toFixed(1)}</span> · {p.reviewCount.toLocaleString("en-IN")} reviews
              </p>
            )}

            <div className="mt-10">
              <AddToCart product={p} />
            </div>

            <ul className="mt-10 flex flex-wrap gap-2">
              {p.certifications.map((c) => (
                <li key={c} className="rounded-full bg-bone px-3.5 py-1.5 text-sm">
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-14 space-y-12">
              <Block title="Overview">
                <p className="text-lg leading-relaxed text-muted">{p.description}</p>
              </Block>

              {p.components && p.components.length > 0 && (
                <Block title="What's in the combo">
                  <ul className="divide-y divide-line/70 border-y border-line/70">
                    {p.components.map((c) => (
                      <li key={c.slug} className="flex items-center justify-between gap-4 py-4">
                        <Link href={`/products/${c.slug}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        <span className="text-sm text-muted">
                          {c.quantity} × {c.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              <Block title="Benefits">
                <ul className="space-y-3">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Key ingredients">
                <ul className="divide-y divide-line/70 border-y border-line/70">
                  {p.keyIngredients.map((i) => (
                    <li key={i.name} className="flex items-baseline justify-between gap-6 py-4">
                      <div>
                        <p className="font-medium">{i.name}</p>
                        <p className="text-sm italic text-muted">{i.latin}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{i.amount}</p>
                        <p className="text-muted">{i.role}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="How to use">
                <p className="text-lg font-medium">{p.dosage}</p>
                <p className="mt-2 leading-relaxed text-muted">{p.howToUse}</p>
              </Block>

              <Block title="Precautions">
                <ul className="space-y-2 text-muted">
                  {p.precautions.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                  <li>Not intended to diagnose, treat, cure or prevent any disease. Consult a qualified Ayurvedic practitioner.</li>
                </ul>
              </Block>

              <Block title="Details">
                <dl className="divide-y divide-line/70 border-y border-line/70 text-sm">
                  {facts.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 py-3">
                      <dt className="text-muted">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </Block>

              {p.faq.length > 0 && (
                <Block title="Questions">
                  <div className="divide-y divide-line/70 border-y border-line/70">
                    {p.faq.map((f) => (
                      <details key={f.q} className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-medium">
                          {f.q}
                          <span className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <p className="pb-5 leading-relaxed text-muted">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </Block>
              )}
            </div>
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16 bg-bone py-24">
          <div className="container-x">
            <h2 className="headline mb-12 text-3xl md:text-5xl">You may also like.</h2>
            <div className="product-grid lg:grid-cols-4">
              {related.map((r) => (
                <ProductCard key={r.slug} product={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}
