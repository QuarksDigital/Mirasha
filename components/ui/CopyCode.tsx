"use client";

import { useState } from "react";

/** Coupon code chip that copies itself to the clipboard. */
export default function CopyCode({ code, tone = "light" }: { code: string; tone?: "light" | "dark" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // clipboard blocked — the code is still visible to type
        }
      }}
      className={`inline-flex items-center gap-2 rounded-full border border-dashed px-3.5 py-1.5 text-sm font-semibold tracking-[0.08em] transition-colors ${
        tone === "dark" ? "border-[#c9a45c] text-[#f3e7c8] hover:bg-white/10" : "border-gold text-gold hover:bg-gold-soft"
      }`}
      aria-label={`Copy code ${code}`}
    >
      {code}
      <span className="text-[11px] font-medium tracking-normal opacity-80">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
