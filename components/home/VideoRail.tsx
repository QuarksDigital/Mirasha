"use client";

import { useEffect, useRef, useState } from "react";
import type { Video } from "@/lib/types";

// Instagram's embed player wraps the reel in its own header (avatar, name) and footer
// (likes, caption), and shows a 9:16 reel pillarboxed - black bars left and right - inside a
// 4:5 box under the header. It also has a minimum width (~326px) below which its layout shifts.
// So the player is always rendered at a fixed IG_W and scaled to the card: wide enough that the
// reel itself is exactly card-wide (4/5 x 9/16 of the player width => 1.4222x), centred, and
// shifted up past the header, so only the video shows at any card size.
const IG_W = 400;
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
  const box = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(0); // player scale for this card's width (0 until measured)

  useEffect(() => {
    const el = box.current;
    if (!el || video.kind !== "instagram") return;
    const ro = new ResizeObserver(([entry]) => setScale((entry.contentRect.width * IG_ZOOM) / IG_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, [video.kind]);

  return (
    <figure ref={box} className="relative aspect-[9/16] w-full snap-start overflow-hidden rounded-[20px] bg-ink">
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
                  width: IG_W,
                  height: IG_HEADER + IG_W * 1.25 + IG_FOOTER,
                  left: `${(-(IG_ZOOM - 1) / 2) * 100}%`,
                  top: -(IG_HEADER + 1) * scale, // +1px hides the embed's hairline border
                  transform: `scale(${scale})`,
                  transformOrigin: "0 0",
                  visibility: scale ? "visible" : "hidden",
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
  const [edge, setEdge] = useState({ start: true, end: false, scrollable: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () =>
      setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4, scrollable: el.scrollWidth > el.clientWidth + 4 });
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
          {/* only when there's more than fits */}
          {edge.scrollable && (
            <div className="flex gap-2">
              <Arrow dir={-1} disabled={edge.start} onClick={() => step(-1)} />
              <Arrow dir={1} disabled={edge.end} onClick={() => step(1)} />
            </div>
          )}
        </div>
      </div>
      {/* Same width as the heading, with cards sized to fit exactly - 2 / 3 / 5 across - so the
          margins match on both sides; extra videos scroll inside it. */}
      <div className="container-x">
        <div
          ref={rail}
          className="grid snap-x snap-mandatory auto-cols-[calc((100%-12px)/2)] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:auto-cols-[calc((100%-32px)/3)] md:gap-4 lg:auto-cols-[calc((100%-80px)/5)] lg:gap-5 [&::-webkit-scrollbar]:hidden"
        >
          {videos.map((v) => (
            <VideoCard key={v._id ?? v.url} video={v} />
          ))}
        </div>
      </div>
    </div>
  );
}
