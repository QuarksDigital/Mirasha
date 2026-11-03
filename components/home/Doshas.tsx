import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

const DOSHAS = [
  {
    name: "Vata",
    elements: "Air and space",
    qualities: "Light, dry, cold, mobile",
    imbalance: "Anxiety, poor sleep, dry skin, irregular digestion.",
    picks: [
      { slug: "shilajit-resin", name: "Shilajit Resin" },
      { slug: "magnesium-gummies", name: "Magnesium Gummies" },
    ],
    accent: "text-brand",
    tint: "bg-brand-soft",
  },
  {
    name: "Pitta",
    elements: "Fire and water",
    qualities: "Hot, sharp, oily, intense",
    imbalance: "Acidity, irritability, skin rashes, inflammation.",
    picks: [
      { slug: "sea-buckthorn-juice", name: "Sea Buckthorn" },
      { slug: "collagen-capsules", name: "Collagen" },
    ],
    accent: "text-gold",
    tint: "bg-gold-soft",
  },
  {
    name: "Kapha",
    elements: "Earth and water",
    qualities: "Heavy, slow, stable, cool",
    imbalance: "Sluggishness, weight gain, congestion.",
    picks: [
      { slug: "apple-cider-vinegar-tablets", name: "Apple Cider" },
      { slug: "acv-moringa-tablets", name: "ACV Moringa" },
    ],
    accent: "text-ink",
    tint: "bg-bone",
  },
];

export default function Doshas() {
  return (
    <Reveal as="section" id="doshas" className="scroll-mt-24 py-24 md:py-36">
      <div className="container-x">
        <SectionHead
          center
          eyebrow="The three doshas"
          title="Made for your constitution."
          subtitle="Ayurveda treats the person, not just the symptom. Every body is a unique balance of three energies."
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {DOSHAS.map((d) => (
            <div key={d.name} data-reveal className={`${d.tint} flex flex-col rounded-[28px] p-8 md:p-10`}>
              <p className="text-sm text-muted">{d.elements}</p>
              <h3 className={`headline mt-2 text-5xl ${d.accent}`}>{d.name}</h3>
              <p className="mt-6 text-sm font-medium">{d.qualities}</p>
              <p className="mt-2 leading-relaxed text-muted">When out of balance: {d.imbalance}</p>
              <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-black/10 pt-6">
                {d.picks.map((p) => (
                  <Link key={p.slug} href={`/products/${p.slug}`} className="link text-[15px]">
                    {p.name} ›
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
