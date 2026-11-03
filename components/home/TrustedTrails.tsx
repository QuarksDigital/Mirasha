import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import { getSettings, getTestimonials, getVideos } from "@/lib/api";
import VideoRail from "./VideoRail";

export default async function TrustedTrails() {
  const [videos, reviews, settings] = await Promise.all([getVideos(), getTestimonials(), getSettings()]);

  return (
    <Reveal as="section" id="trusted-trails" className="scroll-mt-24 py-24 md:py-36">
      {videos.length > 0 ? (
        <div data-reveal>
          <VideoRail
            videos={videos}
            header={
              <>
                <p className="eyebrow mb-3">Trusted trails</p>
                <h2 className="headline text-4xl md:text-6xl">Real people. Real rituals.</h2>
                <p className="mt-5 text-lg leading-relaxed text-muted md:text-xl">Reels from our community and honest words from customers across India.</p>
              </>
            }
            action={
              settings.instagramUrl ? (
                <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="link whitespace-nowrap text-[17px]">
                  Follow @mirasha.wellness ›
                </a>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="container-x">
          <SectionHead eyebrow="Trusted trails" title="Real people. Real rituals." subtitle="Honest words from customers across India." />
        </div>
      )}

      <div className="container-x mt-14 md:mt-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <figure key={r._id ?? i} data-reveal className="flex flex-col rounded-[28px] bg-bone p-7 md:p-9">
              <p className="text-sm tracking-widest text-gold" aria-label={`${r.rating ?? 5} out of 5 stars`}>
                {"★".repeat(r.rating ?? 5)}
                <span className="text-line">{"★".repeat(5 - (r.rating ?? 5))}</span>
              </p>
              <blockquote className="mt-5 text-lg leading-snug tracking-tight md:text-xl">“{r.quote}”</blockquote>
              <figcaption className="mt-auto pt-7 text-sm">
                <p className="font-semibold">
                  {r.name}
                  {r.city ? `, ${r.city}` : ""}
                </p>
                {r.product && <p className="mt-0.5 text-muted">{r.product}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
