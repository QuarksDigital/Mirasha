import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import type { Category } from "@/lib/types";

const TINTS = ["bg-gold-soft", "bg-brand-soft", "bg-bone"];

export default function Concerns({ categories }: { categories: Category[] }) {
  return (
    <Reveal as="section" id="concerns" className="scroll-mt-24 bg-bone py-24 md:py-36">
      <div className="container-x">
        <SectionHead eyebrow="Shop by concern" title="What does your body need?" subtitle="Formulations grouped by what they support, so you can find the right one quickly." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              data-reveal
              className="group flex min-h-48 flex-col justify-between rounded-[28px] bg-paper p-7 transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${TINTS[i % 3]}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-xl font-semibold tracking-tight">{c.name}</h3>
                <p className="mt-1 text-sm text-muted">{c.description}</p>
                <p className="mt-4 text-sm text-brand">
                  {c.count} products <span className="inline-block transition-transform group-hover:translate-x-1">›</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
