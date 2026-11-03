"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getJSON } from "@/lib/client-api";
import { formatPrice } from "@/lib/format";

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { name: string; label: string; quantity: number }[];
  trackingNumber?: string;
}

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  processing: "Being packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function AccountView() {
  const { user, isAdmin, adminPath, loading, logout, update } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<"orders" | "profile">("orders");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/account");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    getJSON<{ orders: Order[] }>("/account/orders")
      .then((d) => setOrders(d.orders))
      .catch(() => setOrders([]));
  }, [user]);

  if (loading || !user) return <div className="h-96 animate-pulse rounded-[36px] bg-bone" />;
  const address = user.addresses?.[0];

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const data: Record<string, unknown> = {
      name: v("name"),
      phone: v("phone"),
      addresses: v("line1") ? [{ line1: v("line1"), line2: v("line2"), city: v("city"), state: v("state"), pincode: v("pincode") }] : [],
    };
    if (v("newPassword")) {
      data.currentPassword = String(f.get("currentPassword") ?? "");
      data.newPassword = String(f.get("newPassword") ?? "");
    }
    try {
      await update(data);
      setMsg({ ok: true, text: "Saved." });
      (e.target as HTMLFormElement).querySelectorAll<HTMLInputElement>("input[type=password]").forEach((i) => (i.value = ""));
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="headline mt-3 text-5xl md:text-6xl">Hello, {user.name.split(" ")[0]}.</h1>
          <p className="mt-3 text-muted">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && adminPath && (
            <a href={`/${adminPath}`} className="btn btn-primary">
              Admin panel
            </a>
          )}
          <button type="button" onClick={() => logout().then(() => router.push("/"))} className="btn btn-ghost">
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-10 flex gap-2">
        {(["orders", "profile"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm ${tab === t ? "bg-ink text-white" : "bg-bone"}`}>
            {t === "orders" ? "Orders" : "Profile & address"}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        <div className="mt-8">
          {orders === null ? (
            <div className="h-40 animate-pulse rounded-[28px] bg-bone" />
          ) : orders.length === 0 ? (
            <div className="rounded-[28px] bg-bone p-8">
              <p className="text-lg">No orders yet.</p>
              <Link href="/shop" className="btn btn-brand mt-6">
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((o) => (
                <li key={o._id} className="rounded-[28px] bg-bone p-6 md:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="font-semibold">{o.orderNumber}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium">{STATUS_LABEL[o.status] ?? o.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {formatPrice(o.total)}
                    {o.trackingNumber ? ` · Tracking ${o.trackingNumber}` : ""}
                  </p>
                  <p className="mt-3 text-sm">{o.items.map((i) => `${i.quantity} × ${i.name} (${i.label})`).join(", ")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <form onSubmit={saveProfile} className="mt-8 max-w-2xl space-y-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <F name="name" label="Full name" defaultValue={user.name} required />
            <F name="phone" label="Mobile number" defaultValue={user.phone} pattern="[6-9][0-9]{9}" />
          </div>
          <div>
            <p className="mb-4 text-xl font-semibold tracking-tight">Saved address</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <F name="line1" label="House no., building, street" defaultValue={address?.line1} wide />
              <F name="line2" label="Area, landmark" defaultValue={address?.line2} wide />
              <F name="city" label="City" defaultValue={address?.city} />
              <F name="state" label="State" defaultValue={address?.state} />
              <F name="pincode" label="PIN code" defaultValue={address?.pincode} pattern="[1-9][0-9]{5}" />
            </div>
          </div>
          <div>
            <p className="mb-4 text-xl font-semibold tracking-tight">Change password</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <F name="currentPassword" label="Current password" type="password" autoComplete="current-password" />
              <F name="newPassword" label="New password" type="password" autoComplete="new-password" minLength={8} />
            </div>
          </div>
          {msg && <p className={`text-sm ${msg.ok ? "text-brand" : "text-red-700"}`}>{msg.text}</p>}
          <button type="submit" className="btn btn-brand">
            Save changes
          </button>
        </form>
      )}
    </div>
  );
}

function F({ label, wide, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-sm text-muted">{label}</span>
      <input {...props} className="field" />
    </label>
  );
}
