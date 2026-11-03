"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Logo from "@/components/layout/Logo";
import ResourceManager from "./ResourceManager";
import { RESOURCES } from "./schemas";
import { Assistant, Customers, Dashboard, Orders, Settings, syncCatalogue } from "./AdminSections";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
  { id: "offers", label: "Offers" },
  { id: "coupons", label: "Coupons" },
  { id: "posts", label: "Journal" },
  { id: "testimonials", label: "Reviews" },
  { id: "videos", label: "Videos" },
  { id: "customers", label: "Customers" },
  { id: "assistant", label: "AI assistant" },
  { id: "settings", label: "Settings" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function SyncButton() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <>
      {msg && <span className="self-center text-xs text-muted">{msg}</span>}
      <button
        type="button"
        onClick={async () => {
          if (!window.confirm("Re-import the bundled catalogue? Products are matched by slug; edits to those products are overwritten.")) return;
          try {
            setMsg(await syncCatalogue());
          } catch (e) {
            setMsg((e as Error).message);
          }
        }}
        className="btn btn-ghost !h-10"
      >
        Sync catalogue
      </button>
    </>
  );
}

/** Looks like any other missing page, so the panel's existence isn't revealed to non-admins. */
function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="headline text-6xl">404</p>
      <p className="text-muted">This page could not be found.</p>
      <Link href="/" className="btn btn-brand mt-2">
        Back to home
      </Link>
    </div>
  );
}

export default function AdminApp() {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    document.documentElement.dataset.admin = "";
    return () => {
      delete document.documentElement.dataset.admin;
    };
  }, []);

  if (loading) return <div className="min-h-svh bg-bone" />;
  if (!user || !isAdmin) return <NotFound />;

  const current = TABS.find((t) => t.id === tab)!;
  let body: React.ReactNode;
  if (tab === "dashboard") body = <Dashboard />;
  else if (tab === "orders") body = <Orders />;
  else if (tab === "customers") body = <Customers />;
  else if (tab === "assistant") body = <Assistant />;
  else if (tab === "settings") body = <Settings />;
  else body = <ResourceManager key={tab} config={RESOURCES[tab]} extraActions={tab === "products" ? <SyncButton /> : undefined} />;

  return (
    <div className="min-h-svh bg-bone md:flex" data-lenis-prevent>
      <aside className="border-b border-line/70 bg-white md:sticky md:top-0 md:h-svh md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/" aria-label="Back to store">
            <Logo />
          </Link>
          <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-[11px] font-medium text-gold">Admin</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible" aria-label="Admin">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm transition-colors ${tab === t.id ? "bg-brand text-white" : "text-ink/80 hover:bg-bone"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="hidden px-5 py-4 text-xs text-muted md:absolute md:bottom-0 md:block">
          <p className="truncate">{user.email}</p>
          <button type="button" onClick={() => logout().then(() => router.push("/"))} className="mt-2 hover:text-ink">
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
        <h1 className="headline mb-8 text-3xl md:text-4xl">{current.label}</h1>
        {body}
      </div>
    </div>
  );
}
