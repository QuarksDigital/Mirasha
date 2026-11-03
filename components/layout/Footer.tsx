import Link from "next/link";
import Logo from "./Logo";
import { getSettings } from "@/lib/api";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/offers", label: "Offers & combos" },
      { href: "/blog", label: "The journal" },
      { href: "/#trusted-trails", label: "Reviews" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in / Register" },
      { href: "/account", label: "My orders" },
      { href: "/cart", label: "Cart" },
      { href: "/checkout", label: "Checkout" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "#", label: "Shipping & delivery" },
      { href: "#", label: "Returns & refunds" },
      { href: "#", label: "Privacy policy" },
      { href: "#", label: "Terms of use" },
    ],
  },
];

export default async function Footer() {
  const s = await getSettings();
  const contact = [
    s.instagramUrl && { label: "@mirasha.wellness", href: s.instagramUrl, external: true },
    s.whatsappNumber && { label: `WhatsApp ${s.supportPhone ?? ""}`.trim(), href: `https://wa.me/${s.whatsappNumber}`, external: true },
    s.supportEmail && { label: s.supportEmail, href: `mailto:${s.supportEmail}` },
    s.shopifyUrl && { label: "Shop on Shopify ↗", href: s.shopifyUrl, external: true },
    { label: "Delhi NCR, India" },
  ].filter(Boolean) as { label: string; href?: string; external?: boolean }[];

  return (
    <footer className="bg-brand text-[13px] text-white/65">
      <div className="container-x py-16">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <span className="text-[#c9a45c]">
              <Logo height={30} />
            </span>
            <p className="tagline mt-3 text-base text-[#e8dcc0]">The Art of Inner Harmony</p>
            <p className="mt-4 max-w-xs leading-relaxed">Premium Ayurvedic and modern wellness formulations. Made in India.</p>
            <p className="mt-4 text-white/45">www.mirasha.in</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-3 font-semibold text-[#c9a45c]">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-3 font-semibold text-[#c9a45c]">Contact</p>
            <ul className="space-y-2.5">
              {contact.map((c) => (
                <li key={c.label}>
                  {c.href ? (
                    <a href={c.href} className="transition-colors hover:text-white" {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}>
                      {c.label}
                    </a>
                  ) : (
                    c.label
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs md:flex-row md:justify-between">
          <p>Copyright © 2026 Mirasha. All rights reserved.</p>
          <p>These products are not intended to diagnose, treat, cure or prevent any disease.</p>
        </div>
      </div>
    </footer>
  );
}
