"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { done, track } from "@/lib/preload";
import { setScrollGuard } from "@/lib/scroll-guard";
import Logo from "@/components/layout/Logo";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PillScene = dynamic(() => import("./PillScene"), { ssr: false });

// Timeline is laid out on 0 → 1 so positions read as scroll progress.
// Keep in sync with the phases documented in PillScene.
const T = {
  copyOut: [0, 0.1],
  white: [0.39, 0.44], // fades to the tablets' own colour (not white) once they cover the lens
  black: [0.48, 0.53],
  slide: [0.56, 0.9],
} as const;

const AYURVEDA_BENEFITS = [
  { title: "Whole-body balance", body: "Treats the root cause and the whole person, not just symptoms." },
  { title: "Natural ingredients", body: "Time-tested herbs, minerals and botanicals from nature." },
  { title: "Prevention first", body: "Daily rituals that build immunity, energy and resilience." },
  { title: "5,000 years of wisdom", body: "Classical knowledge, now supported by modern science." },
];

const FULL_PLAY_S = 4.2; // auto-play duration for the whole sequence, forwards
const REWIND_S = 2.2; // …and backwards, when scrolling up into the hero
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(true);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  const autoDir = useRef<-1 | 0 | 1>(0); // direction of the running auto-play, 0 = idle

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  /** Play the sequence to its end (1) or rewind it to the start (-1), from wherever it is. */
  const autoPlay = useCallback((dir: 1 | -1) => {
    const st = triggerRef.current;
    const l = lenisRef.current;
    if (!st || autoDir.current === dir) return;
    const target = dir > 0 ? st.end : st.start;
    if (!l) return window.scrollTo({ top: target, behavior: "smooth" });
    const remaining = Math.abs(target - l.scroll) / (st.end - st.start);
    if (remaining < 0.002) return;
    autoDir.current = dir;
    l.scrollTo(target, {
      duration: Math.max(0.5, (dir > 0 ? FULL_PLAY_S : REWIND_S) * remaining),
      easing: easeInOutSine,
      force: true,
      onComplete: () => (autoDir.current = 0),
    });
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.hero = "on";
    track("hero-scene"); // the loading screen waits for the bottle's first frame
    return () => {
      delete document.documentElement.dataset.hero;
    };
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "+=260%",
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          // Touch scrolling is native (not routed through Lenis), so the wheel guard below
          // can't see it: snap to the end/start in the swipe direction instead.
          snap: window.matchMedia("(pointer: coarse)").matches
            ? { snapTo: [0, 1], directional: true, duration: { min: 1, max: 4 }, delay: 0.05, ease: "sine.inOut" }
            : undefined,
          // Scrolling back up out of the page into the hero rewinds it fully.
          onEnterBack: () => autoPlay(-1),
          onLeave: () => (document.documentElement.dataset.hero = "past"),
          onUpdate: (self) => {
            progress.current = self.progress;
            // "past" (hero fully scrolled away) lets the header's offers marquee slide in
            document.documentElement.dataset.hero = self.progress < T.slide[0] + 0.05 ? "on" : self.progress > 0.995 ? "past" : "off";
            setActive(self.progress < T.black[1]);
          },
        },
      });
      triggerRef.current = tl.scrollTrigger ?? null;

      // Explicit from/to values everywhere: if the first render lands mid-timeline (e.g. a
      // restored scroll position), lazily-recorded start values would otherwise be wrong
      // and scrolling back would leave layers stuck (the "white hero" bug).
      const copy = q("[data-hero-copy]");
      const canvas = q("[data-hero-canvas]");
      const white = q("[data-hero-white]");
      const black = q("[data-hero-black]");
      const reveal = q("[data-reveal-item]");
      gsap.set(copy, { autoAlpha: 1, y: 0 });
      gsap.set(canvas, { autoAlpha: 1 });
      gsap.set([white, black], { autoAlpha: 0, yPercent: 0 });
      gsap.set(reveal, { autoAlpha: 0, y: 40 });
      const at = { immediateRender: false };

      tl.to({}, { duration: 1 }, 0)
        .fromTo(copy, { autoAlpha: 1, y: 0 }, { ...at, autoAlpha: 0, y: -24, duration: T.copyOut[1] - T.copyOut[0] }, T.copyOut[0])
        .fromTo(white, { autoAlpha: 0 }, { ...at, autoAlpha: 1, duration: T.white[1] - T.white[0] }, T.white[0])
        .fromTo(black, { autoAlpha: 0 }, { ...at, autoAlpha: 1, duration: T.black[1] - T.black[0] }, T.black[0])
        .fromTo([canvas, white], { autoAlpha: 1 }, { ...at, autoAlpha: 0, duration: 0.001 }, T.black[1])
        .fromTo(black, { yPercent: 0 }, { ...at, yPercent: 100, duration: T.slide[1] - T.slide[0], ease: "power2.inOut" }, T.slide[0])
        .fromTo(reveal, { autoAlpha: 0, y: 40 }, { ...at, autoAlpha: 1, y: 0, stagger: 0.02, duration: 0.12, ease: "power2.out" }, T.slide[0] + 0.05);

      // Wheel input inside the hero doesn't scrub - one flick plays the whole sequence,
      // and scrolling up (at any point, even mid-play) rewinds it.
      setScrollGuard(({ deltaY, event }) => {
        const st = triggerRef.current;
        const l = lenisRef.current;
        if (!st || !l || event.type.startsWith("touch")) return true;
        const y = l.scroll;
        let dir: 1 | -1 | 0 = 0;
        if (deltaY > 0 && y < st.end - 1) dir = 1;
        else if (deltaY < 0 && y > st.start + 1 && y <= st.end + 1) dir = -1;
        if (dir === 0 && autoDir.current === 0) return true; // normal scrolling
        if (event.cancelable) event.preventDefault();
        if (dir !== 0) autoPlay(dir);
        return false;
      });
      return () => setScrollGuard(null);
    },
    { scope: root }
  );

  const markSceneReady = useCallback(() => done("hero-scene"), []);

  const play = useCallback(() => autoPlay(1), [autoPlay]);

  return (
    <section ref={root} className="relative h-svh w-full overflow-hidden bg-paper" aria-label="Introduction">
      {/* Layer 0 - what the black curtain reveals */}
      <div className="absolute inset-0 flex items-center justify-center bg-paper pt-14">
        <div className="container-x text-center">
          <p data-reveal-item className="eyebrow">
            Ayurvedic · Natural · Wellness
          </p>
          <h2 data-reveal-item className="headline mx-auto mt-3 max-w-4xl text-[clamp(2.2rem,5.6vw,4.75rem)]">
            A complete wellness universe.
            <br />
            <span className="text-muted">Now under one brand.</span>
          </h2>
          <p data-reveal-item className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            Premium Ayurvedic and modern wellness formulations, made with high-quality ingredients and backed by science.
          </p>
          <div data-reveal-item className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <Link href="/shop" className="btn btn-brand">
              Shop all products
            </Link>
            <Link href="/blog/ayurveda-basics-doshas" className="link text-[17px]">
              Why Ayurveda ›
            </Link>
          </div>
          {/* The benefits of Ayurveda */}
          <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-5 border-t border-line/70 pt-7 text-left md:mt-12 md:grid-cols-4">
            {AYURVEDA_BENEFITS.map((b) => (
              <li key={b.title} data-reveal-item>
                <p className="text-sm font-semibold md:text-[15px]">
                  <span className="mr-1.5 text-gold">✦</span>
                  {b.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted md:text-sm">{b.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Layer 1 - the Ashwagandha bottle */}
      <div data-hero-canvas className="absolute inset-0 bg-black">
        <PillScene progress={progress} onPillClick={play} active={active} onReady={markSceneReady} />
      </div>

      {/* Layer 2 - hero copy */}
      {/* Landscape (`side` variant): text left, bottle right (offset in PillScene). Portrait: text on top, bottle below. */}
      <div data-hero-copy className="pointer-events-none absolute inset-0 text-[#f5f5f7]">
        <div className="container-x flex h-full flex-col items-center pt-24 text-center side:items-start side:justify-center side:pt-0 side:text-left">
          <h1 className="text-[#c9a45c]">
            <Logo fluid className="w-[clamp(200px,30vw,420px)]" />
          </h1>
          <p className="tagline mt-4 text-[clamp(1.25rem,2vw,1.75rem)] text-[#e8dcc0]">The Art of Inner Harmony</p>
          <p className="mt-2 max-w-sm text-base text-white/55 md:text-lg">Premium Ayurvedic &amp; modern wellness.</p>
          <Link href="/shop" className="btn btn-gold pointer-events-auto mt-8">
            Shop now
          </Link>
        </div>
        <button
          type="button"
          onClick={play}
          aria-label="Pour the tablets"
          className="pointer-events-auto absolute bottom-6 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Layer 3 - fade to tablet colour as the tablets fill the lens */}
      {/* plain tablet colour, matched to the lit tablets that cover the lens just before */}
      <div data-hero-white className="pointer-events-none invisible absolute inset-0 bg-[#b4966f] opacity-0" />

      {/* Layer 4 - black curtain that slides down */}
      <div data-hero-black className="pointer-events-none invisible absolute inset-0 bg-black opacity-0" />
    </section>
  );
}
