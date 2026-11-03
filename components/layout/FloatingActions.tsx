"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string; sources?: { title: string; url: string }[]; error?: boolean };

const SUGGESTIONS = ["What helps with energy?", "Which combo is best for skin?", "How do I use Shilajit resin?", "Do you deliver across India?"];

/** Tiny, safe markdown: [links](/path), **bold**, and "- " bullet lists. */
function Rich({ text }: { text: string }) {
  const inline = (line: string, key: number) => {
    const parts: React.ReactNode[] = [];
    const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      if (m[1]) {
        const href = m[2];
        parts.push(
          href.startsWith("/") ? (
            <Link key={`${key}-${m.index}`} href={href} className="font-medium text-brand underline underline-offset-2">
              {m[1]}
            </Link>
          ) : /^https?:\/\//.test(href) ? (
            <a key={`${key}-${m.index}`} href={href} target="_blank" rel="noreferrer" className="font-medium text-brand underline underline-offset-2">
              {m[1]}
            </a>
          ) : (
            m[1]
          )
        );
      } else parts.push(<strong key={`${key}-${m.index}`}>{m[3]}</strong>);
      last = m.index + m[0].length;
    }
    parts.push(line.slice(last));
    return parts;
  };
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (k: number) => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${k}`} className="my-1.5 list-disc space-y-1 pl-5">
          {bullets.map((b, i) => (
            <li key={i}>{inline(b, i)}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };
  text.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (/^[-•*] /.test(t)) bullets.push(t.slice(2));
    else {
      flush(i);
      if (t) blocks.push(<p key={i} className="my-1">{inline(t, i)}</p>);
    }
  });
  flush(-1);
  return <>{blocks}</>;
}

export default function FloatingActions({ whatsappNumber, whatsappMessage }: { whatsappNumber?: string; whatsappMessage?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...messages.filter((m) => !m.error), { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    abort.current = new AbortController();
    const patch = (fn: (m: Msg) => Msg) => setMessages((all) => [...all.slice(0, -1), fn(all[all.length - 1])]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "The assistant is unavailable right now.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const data = JSON.parse(line.slice(6));
          if (data.text) patch((m) => ({ ...m, content: m.content + data.text }));
          if (data.sources) patch((m) => ({ ...m, sources: data.sources }));
          if (data.error) patch((m) => ({ ...m, content: data.error, error: true }));
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") patch((m) => ({ ...m, content: (err as Error).message, error: true }));
    } finally {
      setBusy(false);
    }
  }

  const wa = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage ?? "Hi Mirasha!")}` : null;

  return (
    <div className="floating-actions">
      {/* launcher buttons */}
      <div className={`fixed bottom-5 right-5 z-[70] flex flex-col items-center gap-3 transition-opacity md:bottom-7 md:right-7 ${open ? "pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100" : ""}`}>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat with Mirasha on WhatsApp"
            className="flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
              <path d="M16 3C9 3 3.3 8.6 3.3 15.6c0 2.4.7 4.7 1.9 6.7L3 29l6.9-2.1c1.9 1 4 1.6 6.1 1.6 7 0 12.7-5.6 12.7-12.6S23 3 16 3Zm0 23.1c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.1 1.2 1.2-4-.3-.4c-1.1-1.7-1.7-3.6-1.7-5.6C5.3 9.8 10.1 5.1 16 5.1s10.7 4.7 10.7 10.5S21.9 26.1 16 26.1Zm5.9-7.8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.4 3.7 5.9 5.1 2.9 1.1 3.5.9 4.1.8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4Z" />
            </svg>
          </a>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close the Mirasha assistant" : "Ask the Mirasha assistant"}
          className="flex h-13 w-13 items-center justify-center rounded-full bg-brand text-[#c9a45c] shadow-[0_8px_24px_rgba(26,67,49,0.35)] transition-transform hover:scale-105"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M12 2.5l1.6 4.9 4.9 1.6-4.9 1.6L12 15.5l-1.6-4.9L5.5 9l4.9-1.6L12 2.5zM18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6zM6 15l.7 2 2 .7-2 .7L6 20.4l-.7-2-2-.7 2-.7L6 15z" />
            </svg>
          )}
        </button>
      </div>

      {/* chat panel */}
      <section
        role="dialog"
        aria-label="Mirasha assistant"
        className={`fixed inset-0 z-[75] flex flex-col bg-paper transition-all duration-300 md:inset-auto md:bottom-28 md:right-7 md:h-[600px] md:max-h-[calc(100svh-9rem)] md:w-[400px] md:rounded-[28px] md:border md:border-line/70 md:shadow-[0_24px_60px_rgba(0,0,0,0.18)] ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line/70 bg-brand px-5 py-4 text-white md:rounded-t-[28px]">
          <div>
            <p className="font-semibold">Mira · Mirasha assistant</p>
            <p className="text-xs text-white/60">Ask about products, ingredients and orders</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-4 py-5 text-[14.5px] leading-relaxed" data-lenis-prevent>
          {messages.length === 0 && (
            <div className="px-1">
              <p className="text-muted">Hi! I&apos;m Mira. I can help you pick the right products, explain ingredients or answer questions about delivery.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-left text-sm hover:border-brand hover:text-brand">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${m.role === "user" ? "bg-brand text-white" : m.error ? "bg-red-50 text-red-800" : "bg-bone"}`}>
                {m.role === "assistant" ? (
                  m.content ? (
                    <Rich text={m.content} />
                  ) : (
                    <span className="inline-flex gap-1 py-1" aria-label="Typing">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" />
                    </span>
                  )
                ) : (
                  m.content
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line/60 pt-2">
                    {m.sources.map((s) => (
                      <Link key={s.url} href={s.url} className="rounded-full bg-white px-2.5 py-1 text-xs text-brand hover:underline">
                        {s.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-line/70 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything…"
            maxLength={1000}
            aria-label="Your question"
            className="field !h-11 !rounded-full"
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn btn-brand !h-11 !px-4" aria-label="Send">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
        <p className="pb-3 text-center text-[11px] text-muted">AI answers can be imperfect — not medical advice.</p>
      </section>
    </div>
  );
}
