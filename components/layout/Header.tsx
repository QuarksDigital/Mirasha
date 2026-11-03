"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/offers", label: "Offers" },
  { href: "/blog", label: "Journal" },
  { href: "/#trusted-trails", label: "Reviews" },
];

export default function Header({ shopifyUrl, marquee }: { shopifyUrl?: string; marquee?: React.ReactNode }) {
  const { count, open, ready } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  // Remember which page the menu was opened on so navigating closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/80 text-ink backdrop-blur-xl backdrop-saturate-150 touch-solid">
      <div className="container-x flex h-14 items-center justify-between">
        <Link href="/" aria-label="Mirasha home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-[13px] opacity-80 transition-opacity hover:opacity-100">
              {item.label}
            </Link>
          ))}
          {shopifyUrl && (
            <a href={shopifyUrl} target="_blank" rel="noreferrer" className="text-[13px] opacity-80 transition-opacity hover:opacity-100">
              Shopify ↗
            </a>
          )}
        </nav>

        <div className="flex items-center gap-0.5">
          <Link
            href={user ? "/account" : "/login"}
            className="flex h-10 w-10 items-center justify-center rounded-full opacity-80 transition hover:opacity-100"
            aria-label={user ? "Your account" : "Sign in"}
          >
            <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M5 20c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={open}
            className="relative flex h-10 w-10 items-center justify-center rounded-full opacity-80 transition hover:opacity-100"
            aria-label={`Open cart, ${ready ? count : 0} items`}
          >
            <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z" />
              <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
            </svg>
            {ready && count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuPath(menuOpen ? null : pathname)}
            className="flex h-10 w-10 items-center justify-center rounded-full md:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 9h16M4 15h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Offers band tucked under the nav: hidden over the hero, slides down once it's scrolled past */}
      {marquee && (
        <div className="header-marquee">
          <div className="min-h-0 overflow-hidden">{marquee}</div>
        </div>
      )}

      {menuOpen && (
        <nav className="container-x pb-6 pt-2 md:hidden" aria-label="Mobile">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="block py-3 text-2xl font-semibold tracking-tight">
              {item.label}
            </Link>
          ))}
          <Link href={user ? "/account" : "/login"} className="block py-3 text-2xl font-semibold tracking-tight">
            {user ? "Account" : "Sign in"}
          </Link>
          {shopifyUrl && (
            <a href={shopifyUrl} target="_blank" rel="noreferrer" className="block py-3 text-2xl font-semibold tracking-tight">
              Shop on Shopify ↗
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
