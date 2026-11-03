import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import { getPosts } from "@/lib/api";

export default async function JournalTeaser() {
  const posts = (await getPosts()).slice(0, 3);
  if (posts.length === 0) return null;
  return (
    <Reveal as="section" className="py-24 md:py-36">
      <div className="container-x">
        <SectionHead
          eyebrow="The journal"
          title="Learn what's inside."
          subtitle="Clear, honest guides to the ingredients behind every Mirasha product."
          action={
            <Link href="/blog" className="link text-[17px]">
              Read the journal ›
            </Link>
          }
        />
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} data-reveal className="group block">
              <div className="relative aspect-[5/6] overflow-hidden rounded-[28px] bg-bone">
                <Image src={p.cover} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium backdrop-blur">{p.category}</span>
              </div>
              <p className="mt-5 text-xs text-muted">{p.readMinutes} min read</p>
              <h3 className="mt-1 text-xl font-semibold leading-snug tracking-tight group-hover:underline">{p.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
