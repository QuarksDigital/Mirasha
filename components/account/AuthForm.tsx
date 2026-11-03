"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import Logo from "@/components/layout/Logo";

export default function AuthForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isAdmin, adminPath, login, register, logout, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(params.get("mode") === "register" ? "register" : "login");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (!loading && user) {
    return (
      <div className="mx-auto max-w-md rounded-[36px] bg-bone p-8 text-center md:p-10">
        <p className="eyebrow">Signed in</p>
        <h1 className="headline mt-3 text-3xl">Hello, {user.name.split(" ")[0]}.</h1>
        <p className="mt-2 text-muted">{user.email}</p>
        <div className="mt-8 flex flex-col gap-3">
          {isAdmin && adminPath && (
            <a href={`/${adminPath}`} className="btn btn-primary">
              Open admin panel
            </a>
          )}
          <Link href={safeNext} className="btn btn-brand">
            {safeNext === "/account" ? "Go to my account" : "Continue"}
          </Link>
          <button type="button" onClick={() => logout()} className="text-sm text-muted hover:text-ink">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    setError(null);
    try {
      const s =
        mode === "login"
          ? await login(v("email"), String(f.get("password") ?? ""))
          : await register({ name: v("name"), email: v("email"), phone: v("phone"), password: String(f.get("password") ?? "") });
      // Admins stay on the signed-in card (with the admin button); everyone else continues.
      if (!s.isAdmin) router.push(safeNext);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center text-ink">
        <Logo height={34} />
      </div>
      <div className="rounded-[36px] bg-bone p-7 md:p-10">
        <div className="grid grid-cols-2 rounded-full bg-white p-1" role="tablist">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`rounded-full py-2.5 text-sm font-medium transition-colors ${mode === m ? "bg-brand text-white" : "text-muted hover:text-ink"}`}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <h1 className="headline mt-8 text-3xl">{mode === "login" ? "Welcome back." : "Join Mirasha."}</h1>
        <p className="mt-2 text-sm text-muted">{mode === "login" ? "Sign in to track orders and check out faster." : "Save your details, track orders and get 10% off your first order."}</p>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          {mode === "register" && (
            <>
              <Input name="name" label="Full name" autoComplete="name" required minLength={2} />
              <Input name="phone" label="Mobile number (optional)" type="tel" autoComplete="tel" pattern="[6-9][0-9]{9}" />
            </>
          )}
          <Input name="email" label="Email" type="email" autoComplete="email" required />
          <Input
            name="password"
            label="Password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            hint={mode === "register" ? "At least 8 characters" : undefined}
          />
          {error && <p className="rounded-2xl bg-white p-3 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-brand w-full">
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-muted">{label}</span>
      <input {...props} className="field" />
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}
