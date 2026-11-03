import Link from "next/link";
import { getOffers } from "@/lib/api";

const MIN_ITEMS = 8; // repeat short offer lists so one half is always wider than the screen

/** Premium scrolling offers band shown under the navbar. Server component — offers come from the admin panel. */
export default async function OfferMarquee({ tone = "dark", reverse = false }: { tone?: "dark" | "light"; reverse?: boolean }) {
  const offers = await getOffers();
  if (offers.length === 0) return null;
  const items = Array.from({ length: Math.ceil(MIN_ITEMS / offers.length) }, () => offers).flat();
  const dark = tone === "dark";

  const half = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((o, i) => (
        <li key={i} className="flex items-center">
          <Link
            href={o.link || "/offers"}
            tabIndex={hidden ? -1 : undefined}
            className={`whitespace-nowrap px-6 text-[12px] font-medium tracking-[0.03em] transition-colors md:px-8 md:text-[13px] ${
              dark ? "text-[#f3e7c8] hover:text-white" : "text-ink hover:text-brand"
            }`}
          >
            {o.title}
            {o.code && (
              <span className={`ml-2.5 rounded-full border px-2 py-px text-[10px] tracking-[0.08em] ${dark ? "border-[#c9a45c]/50 text-[#c9a45c]" : "border-gold/40 text-gold"}`}>
                {o.code}
              </span>
            )}
          </Link>
          <span className={`text-[10px] ${dark ? "text-[#c9a45c]" : "text-gold"}`} aria-hidden>
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label="Current offers"
      className={`marquee relative flex h-10 items-center overflow-hidden ${dark ? "bg-brand" : "border-y border-line/70 bg-bone"} ${reverse ? "marquee-reverse" : ""}`}
      style={{ ["--marquee-duration" as string]: `${Math.max(28, items.length * 5)}s` }}
    >
      <div className="marquee-track flex w-max">
        {half(false)}
        {half(true)}
      </div>
    </section>
  );
}
