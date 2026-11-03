import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

// Placeholder copy based on the brand's positioning — confirm specifics with the client.
const STEPS = [
  {
    title: "Premium ingredients.",
    body: "From Himalayan Shilajit to sea buckthorn and moringa, every ingredient is chosen for quality and purity.",
  },
  {
    title: "Science-backed formulations.",
    body: "Traditional Ayurvedic wisdom meets modern nutrition science, in formats that fit everyday life.",
  },
  {
    title: "Quality checked.",
    body: "Products are tested for quality and safety before they leave the facility.",
  },
  {
    title: "Delivered to your door.",
    body: "Sealed, protective packaging and fast delivery across India.",
  },
];

export default function Process() {
  return (
    <Reveal as="section" id="process" className="scroll-mt-24 py-24 md:py-36">
      <div className="container-x">
        <SectionHead center eyebrow="Our promise" title="Nature. Science. Wellness." subtitle="The same care goes into every product in the Mirasha range." />
        <ol className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {STEPS.map((s, i) => (
            <li key={s.title} data-reveal>
              <span className="text-sm font-semibold text-gold">0{i + 1}</span>
              <div className="mt-4 h-px bg-line" />
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
