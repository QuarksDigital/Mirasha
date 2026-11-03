"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Post } from "@/lib/types";

gsap.registerPlugin(useGSAP);

const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function BlogIndex({ posts }: { posts: Post[] }) {
  const [category, setCategory] = useState("All");
  const grid = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => ["All", ...new Set(posts.map((p) => p.category))], [posts]);
  const visible = category === "All" ? posts : posts.filter((p) => p.category === category);
  const [featured, ...rest] = visible;

  // Stagger the cards in on first load and whenever the filter changes.
  useGSAP(
    () => {
      gsap.fromTo("[data-card]", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06 });
    },
    { scope: grid, dependencies: [category] }
  );

  return (
    <div className="container-x pb-32">
      <nav className="-mx-1 mb-10 flex gap-2 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filter articles">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${category === c ? "bg-ink text-white" : "bg-bone text-ink hover:bg-[#ebe9e2]"}`}
          >
            {c}
          </button>
        ))}
      </nav>

      <div ref={grid}>
        {featured && (
          <Link href={`/blog/${featured.slug}`} data-card className="group grid items-center gap-8 rounded-[36px] bg-bone p-5 md:grid-cols-2 md:gap-12 md:p-8">
            <div className="relative aspect-[5/6] overflow-hidden rounded-[28px] md:aspect-[5/4]">
              <Image src={featured.cover} alt="" fill preload sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            </div>
            <div className="md:pr-6">
              <p className="text-sm text-muted">
                <span className="font-medium text-gold">{featured.category}</span> · {featured.readMinutes} min read
              </p>
              <h2 className="headline mt-3 text-3xl group-hover:underline md:text-5xl">{featured.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">{featured.excerpt}</p>
              <p className="link mt-6 text-[17px]">Read article ›</p>
            </div>
          </Link>
        )}

        <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} data-card className="group block">
              <div className="relative aspect-[5/6] overflow-hidden rounded-[28px] bg-bone">
                <Image src={p.cover} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium backdrop-blur">{p.category}</span>
              </div>
              <p className="mt-5 text-xs text-muted">
                {formatDate(p.publishedAt)} · {p.readMinutes} min read
              </p>
              <h3 className="mt-1 text-xl font-semibold leading-snug tracking-tight group-hover:underline">{p.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
            </Link>
          ))}
        </div>
        {visible.length === 0 && <p className="py-20 text-center text-muted">No articles in this category yet.</p>}
      </div>
    </div>
  );
}
