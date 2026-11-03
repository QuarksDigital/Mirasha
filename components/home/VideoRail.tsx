"use client";

import { useEffect, useRef, useState } from "react";
import type { Video } from "@/lib/types";

// Instagram's embed player wraps the reel in its own header (avatar, name) and footer
// (likes, caption), and shows a 9:16 reel pillarboxed - black bars left and right - inside a
// 4:5 box under the header. The card is a 9:16 window onto that: the iframe is drawn wider than
// the card so the reel itself is exactly card-wide (4/5 x 9/16 of the iframe width => 1.4222x),
// centred, and shifted up past the header, so only the video shows.
const IG_HEADER = 54;
const IG_ZOOM = 1 / (1.25 * (9 / 16)); // ≈ 1.4222
const IG_FOOTER = 260; // caption area the window hides

function embedSrc(v: Video) {
  if (v.kind === "instagram") {
    // https://www.instagram.com/reel/<code>/ → official embed player
    const m = v.url.match(/instagram\.com\/(?:[^/]+\/)?(reel|p|tv)\/([^/?#]+)/);
    return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed/` : null;
  }
  if (v.kind === "youtube") {
    const m = v.url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&modestbranding=1` : null;
  }
  return null;
}

function VideoCard({ video }: { video: Video }) {
  const src = embedSrc(video);
  return (
    <figure className="relative aspect-[9/16] w-[60vw] max-w-[270px] shrink-0 snap-start overflow-hidden rounded-[22px] bg-ink md:w-[260px]">
      {video.kind === "mp4" ? (
        <video src={video.url} poster={video.poster} controls playsInline preload="none" className="h-full w-full object-cover" />
      ) : src ? (
        <iframe
          src={src}
          title={video.title ?? "Mirasha video"}
          loading="lazy"
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          className="absolute border-0"
          style={
            video.kind === "instagram"
              ? {
                  top: -IG_HEADER - 1, // -1px hides the embed's hairline border
                  left: `${(-(IG_ZOOM - 1) / 2) * 100}%`,
                  width: `${IG_ZOOM * 100}%`,
                  height: `calc(100% + ${IG_HEADER + IG_FOOTER}px)`,
                }
              : { top: 0, left: 0, width: "100%", height: "100%" }
          }
        />
      ) : null}
    </figure>
  );
}

const Arrow = ({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={dir < 0 ? "Previous videos" : "Next videos"}
    className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-ink disabled:opacity-30 disabled:hover:border-line"
  >
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  </button>
);

/** Horizontal reel row: snap scrolling, hidden scrollbar, previous/next buttons beside the heading. */
export default function VideoRail({ videos, header, action }: { videos: Video[]; header: React.ReactNode; action?: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const step = (dir: -1 | 1) => {
    const el = rail.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const perView = Math.max(1, Math.floor(el.clientWidth / (card.offsetWidth + gap)));
    el.scrollBy({ left: dir * perView * (card.offsetWidth + gap), behavior: "smooth" });
  };

  return (
    <div>
      <div className="container-x mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">{header}</div>
        <div className="flex items-center justify-between gap-6 md:justify-end">
          {action}
          <div className="flex gap-2">
            <Arrow dir={-1} disabled={edge.start} onClick={() => step(-1)} />
            <Arrow dir={1} disabled={edge.end} onClick={() => step(1)} />
          </div>
        </div>
      </div>
      <div
        ref={rail}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 [scrollbar-width:none] md:gap-5 md:scroll-px-8 md:px-8 lg:scroll-px-[max(2rem,calc((100vw-1200px)/2+2rem))] lg:px-[max(2rem,calc((100vw-1200px)/2+2rem))] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((v) => (
          <VideoCard key={v._id ?? v.url} video={v} />
        ))}
      </div>
    </div>
  );
}
