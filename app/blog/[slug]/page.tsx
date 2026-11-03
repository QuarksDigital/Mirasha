import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductCard from "@/components/product/ProductCard";
import ReadingProgress from "@/components/blog/ReadingProgress";
import Reveal from "@/components/ui/Reveal";
import { getPost, getPosts, getProducts } from "@/lib/api";

export async function generateStaticParams() {
  const posts = await getPosts();
  // Cache Components requires at least one param; the placeholder renders a 404.
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.cover], type: "article" },
  };
}

export default function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<div className="container-x min-h-screen pt-32" aria-busy />}>
      <Article params={params} />
    </Suspense>
  );
}

async function Article({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const { slug } = await params;
  const [post, posts, products] = await Promise.all([getPost(slug), getPosts(), getProducts()]);
  if (!post) notFound();
  const related = (post.relatedProducts ?? []).map((s) => products.find((p) => p.slug === s)).filter((p) => p !== undefined).slice(0, 4);
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const date = new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <article className="pt-24">
      <ReadingProgress />
      <Reveal as="section" className="container-x grid items-center gap-10 pb-16 pt-12 md:grid-cols-[1.1fr_1fr] md:gap-16 md:pt-20">
        <div>
          <Link href="/blog" data-reveal className="text-sm text-muted hover:text-ink">
            ‹ The journal
          </Link>
          <p data-reveal className="mt-6 text-sm text-muted">
            <span className="font-medium text-gold">{post.category}</span> · {date} · {post.readMinutes} min read
          </p>
          <h1 data-reveal className="headline mt-3 text-4xl md:text-6xl">
            {post.title}
          </h1>
          <p data-reveal className="mt-5 text-lg leading-relaxed text-muted md:text-xl">
            {post.excerpt}
          </p>
        </div>
        <div data-reveal className="relative aspect-[5/6] overflow-hidden rounded-[36px] bg-bone">
          <Image src={post.cover} alt="" fill preload sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
        </div>
      </Reveal>

      <Reveal as="div" className="container-x">
        <div className="mx-auto max-w-[680px] space-y-14 border-t border-line/70 pt-14">
          {(post.sections ?? []).map((s, i) => (
            <section key={s.heading} data-reveal>
              <p className="text-sm font-semibold text-gold">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{s.heading}</h2>
              {s.body?.map((para) => (
                <p key={para.slice(0, 40)} className="mt-4 text-[17px] leading-[1.75] text-ink/85">
                  {para}
                </p>
              ))}
              {s.points && (
                <ul className="mt-5 space-y-3">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex gap-3 text-[17px] leading-relaxed text-ink/85">
                      <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {pt}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <p data-reveal className="rounded-2xl bg-bone p-5 text-sm leading-relaxed text-muted">
            This article is for general information only and isn&apos;t medical advice. Please consult a qualified doctor before starting any supplement, especially if you are pregnant, nursing, taking medication or managing a health condition.
          </p>
        </div>
      </Reveal>

      {related.length > 0 && (
        <section className="mt-24 bg-bone py-20 md:py-24">
          <div className="container-x">
            <h2 className="headline mb-10 text-3xl md:text-4xl">Shop this article.</h2>
            <div className="product-grid lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-x py-20 md:py-28">
        <h2 className="headline mb-10 text-3xl md:text-4xl">Keep reading.</h2>
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-3">
          {more.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
              <div className="relative aspect-[5/6] overflow-hidden rounded-[28px] bg-bone">
                <Image src={p.cover} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              </div>
              <p className="mt-5 text-xs text-muted">
                {p.category} · {p.readMinutes} min read
              </p>
              <h3 className="mt-1 text-lg font-semibold leading-snug tracking-tight group-hover:underline">{p.title}</h3>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
