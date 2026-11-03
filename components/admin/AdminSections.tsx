"use client";

import { useCallback, useEffect, useState } from "react";
import { getJSON, patchJSON, postJSON, putJSON } from "@/lib/client-api";
import { formatPrice } from "@/lib/format";
import { STATUS_LABEL } from "@/components/account/AccountView";
import ResourceManager from "./ResourceManager";
import { RESOURCES } from "./schemas";

/** Small fetch hook: data, error, reload. */
function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      setData(await getJSON<T>(path));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [path]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reload() sets state after the request resolves
    reload();
  }, [reload]);
  return { data, error, reload };
}

const Card = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-2xl border border-line/70 bg-white p-5">
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
  </div>
);

const Panel = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="rounded-2xl border border-line/70 bg-white p-5">
    <div className="mb-4 flex items-center justify-between gap-3">
      <p className="font-semibold">{title}</p>
      {action}
    </div>
    {children}
  </div>
);

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  discount?: number;
  shipping: number;
  coupon?: { code: string } | null;
  createdAt: string;
  customer: { name: string; email?: string; phone: string };
  shippingAddress: { line1: string; line2?: string; city: string; state: string; pincode: string };
  items: { name: string; label: string; quantity: number; lineTotal: number }[];
  trackingNumber?: string;
  adminNote?: string;
  timeline?: { status: string; at: string; by?: string }[];
}

// ---------- Dashboard ----------

interface Stats {
  store: string;
  revenue: number;
  orders: number;
  pendingOrders: number;
  customers: number;
  averageOrder: number;
  lowStock: { slug: string; name: string; label: string; stock: number }[];
  topProducts: { name: string; quantity: number }[];
  daily: { date: string; revenue: number; orders: number }[];
  recentOrders: Order[];
}

export function Dashboard() {
  const { data: s, error } = useLoad<Stats>("/admin/stats");
  if (error) return <p className="text-red-700">{error}</p>;
  if (!s) return <p className="text-muted">Loading…</p>;
  const max = Math.max(1, ...s.daily.map((d) => d.revenue));
  return (
    <div className="space-y-5">
      {s.store === "file" && (
        <p className="rounded-xl bg-gold-soft p-3 text-sm">
          Data is stored in local files (backend/.data). Set <code>MONGODB_URI</code> in backend/.env to use MongoDB in production.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card label="Revenue" value={formatPrice(s.revenue)} sub="Paid, processing, shipped, delivered" />
        <Card label="Orders" value={String(s.orders)} />
        <Card label="Need action" value={String(s.pendingOrders)} sub="Awaiting payment / packing" />
        <Card label="Customers" value={String(s.customers)} />
        <Card label="Average order" value={formatPrice(s.averageOrder)} />
      </div>
      <Panel title="Revenue — last 14 days">
        <div className="flex h-44 items-end gap-1.5">
          {s.daily.map((d) => (
            <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
              <div className="w-full rounded-t-md bg-brand/80 transition-colors group-hover:bg-brand" style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }} />
              <span className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded bg-ink px-2 py-1 text-[11px] text-white group-hover:block">
                {d.date.slice(5)} · {formatPrice(d.revenue)} · {d.orders} orders
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted">
          <span>{s.daily[0]?.date.slice(5)}</span>
          <span>{s.daily.at(-1)?.date.slice(5)}</span>
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Low stock">
          {s.lowStock.length === 0 ? (
            <p className="text-sm text-muted">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {s.lowStock.map((v) => (
                <li key={`${v.slug}-${v.label}`} className="flex justify-between gap-3">
                  <span className="truncate">
                    {v.name} <span className="text-muted">({v.label})</span>
                  </span>
                  <span className={v.stock === 0 ? "font-semibold text-red-700" : "text-gold"}>{v.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Top products">
          {s.topProducts.length === 0 ? (
            <p className="text-sm text-muted">No paid orders yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {s.topProducts.map((p) => (
                <li key={p.name} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-muted">{p.quantity} sold</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent orders">
          <ul className="space-y-2 text-sm">
            {s.recentOrders.length === 0 && <li className="text-muted">No orders yet.</li>}
            {s.recentOrders.map((o) => (
              <li key={o._id} className="flex justify-between gap-3">
                <span className="truncate">
                  {o.orderNumber} <span className="text-muted">· {o.customer?.name}</span>
                </span>
                <span>{formatPrice(o.total)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ---------- Orders ----------

export function Orders() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const { data, error, reload } = useLoad<{ orders: Order[]; statuses: string[] }>(`/admin/orders?status=${status}&q=${encodeURIComponent(q)}`);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      await patchJSON(`/admin/orders/${id}`, body);
      await reload();
    } finally {
      setBusy(null);
    }
  }

  const exportCsv = () => {
    if (!data) return;
    const rows = [["Order", "Date", "Status", "Customer", "Phone", "Email", "City", "Pincode", "Items", "Total"]].concat(
      data.orders.map((o) => [o.orderNumber, o.createdAt.slice(0, 10), o.status, o.customer?.name, o.customer?.phone, o.customer?.email ?? "", o.shippingAddress?.city, o.shippingAddress?.pincode, o.items.map((i) => `${i.quantity}x ${i.name}`).join("; "), String(o.total)])
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `mirasha-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, name, phone, email" className="field !h-10 max-w-xs !rounded-full" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field !h-10 !w-auto !rounded-full">
          <option value="">All statuses</option>
          {(data?.statuses ?? []).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s] ?? s}
            </option>
          ))}
        </select>
        <button type="button" onClick={exportCsv} className="btn btn-ghost !h-10">
          Export CSV
        </button>
      </div>
      {error && <p className="mt-4 text-red-700">{error}</p>}
      <div className="mt-5 space-y-3">
        {data?.orders.length === 0 && <p className="text-muted">No orders match.</p>}
        {data?.orders.map((o) => (
          <div key={o._id} className="rounded-2xl border border-line/70 bg-white">
            <button type="button" onClick={() => setOpen(open === o._id ? null : o._id)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left">
              <span className="font-medium">{o.orderNumber}</span>
              <span className="text-sm text-muted">
                {o.customer?.name} · {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
              <span className="rounded-full bg-bone px-3 py-1 text-xs">{STATUS_LABEL[o.status] ?? o.status}</span>
            </button>
            {open === o._id && (
              <div className="grid gap-5 border-t border-line/70 px-5 py-5 text-sm md:grid-cols-3">
                <div>
                  <p className="mb-2 font-semibold">Items</p>
                  <ul className="space-y-1">
                    {o.items.map((i) => (
                      <li key={i.name + i.label}>
                        {i.quantity} × {i.name} <span className="text-muted">({i.label})</span> — {formatPrice(i.lineTotal)}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-muted">
                    Subtotal {formatPrice(o.subtotal)}
                    {o.discount ? ` · Coupon ${o.coupon?.code} −${formatPrice(o.discount)}` : ""} · Delivery {o.shipping ? formatPrice(o.shipping) : "free"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-semibold">Customer</p>
                  <p>{o.customer?.name}</p>
                  <p className="text-muted">
                    {o.customer?.phone} {o.customer?.email ? `· ${o.customer.email}` : ""}
                  </p>
                  <p className="mt-2 text-muted">
                    {o.shippingAddress?.line1}
                    {o.shippingAddress?.line2 ? `, ${o.shippingAddress.line2}` : ""}, {o.shippingAddress?.city}, {o.shippingAddress?.state} {o.shippingAddress?.pincode}
                  </p>
                  {o.customer?.phone && (
                    <a href={`https://wa.me/91${o.customer.phone.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-brand hover:underline">
                      Message on WhatsApp ↗
                    </a>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-xs text-muted">Status</span>
                    <select value={o.status} disabled={busy === o._id} onChange={(e) => patch(o._id, { status: e.target.value })} className="field mt-1 !h-10">
                      {data.statuses.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s] ?? s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted">Tracking number</span>
                    <input defaultValue={o.trackingNumber} onBlur={(e) => e.target.value !== (o.trackingNumber ?? "") && patch(o._id, { trackingNumber: e.target.value })} className="field mt-1 !h-10" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted">Internal note</span>
                    <input defaultValue={o.adminNote} onBlur={(e) => e.target.value !== (o.adminNote ?? "") && patch(o._id, { note: e.target.value })} className="field mt-1 !h-10" />
                  </label>
                  {o.timeline && (
                    <ul className="space-y-1 text-xs text-muted">
                      {o.timeline.map((t, i) => (
                        <li key={i}>
                          {new Date(t.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })} — {STATUS_LABEL[t.status] ?? t.status}
                          {t.by ? ` (${t.by})` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Customers ----------

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  blocked?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  orders: number;
  spent: number;
}

export function Customers() {
  const { data, error, reload } = useLoad<{ users: Customer[] }>("/admin/users");
  const [q, setQ] = useState("");
  const visible = (data?.users ?? []).filter((u) => !q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers" className="field !h-10 max-w-xs !rounded-full" />
      {error && <p className="mt-4 text-red-700">{error}</p>}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-line/70 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-bone text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Spent</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {visible.map((u) => (
              <tr key={u._id} className={u.blocked ? "opacity-50" : ""}>
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3 text-muted">{u.phone || "—"}</td>
                <td className="px-4 py-3 text-muted">{u.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-3">{u.orders}</td>
                <td className="px-4 py-3">{formatPrice(u.spent)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await patchJSON(`/admin/users/${u._id}`, { blocked: !u.blocked });
                        await reload();
                      } catch (e) {
                        alert((e as Error).message);
                      }
                    }}
                    className={u.blocked ? "text-brand hover:underline" : "text-red-700 hover:underline"}
                  >
                    {u.blocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- AI assistant ----------

interface ChatLogs {
  last30Days: { conversations: number; estimatedUsd: number; estimatedInr: number };
  logs: { _id: string; question: string; createdAt: string; estimatedInr: number; sources?: string[]; stopReason?: string }[];
}

export function Assistant() {
  const { data, error } = useLoad<ChatLogs>("/admin/chat-logs");
  return (
    <div className="space-y-6">
      {error && <p className="text-red-700">{error}</p>}
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card label="Questions (30 days)" value={String(data.last30Days.conversations)} />
          <Card label="Estimated cost (30 days)" value={`₹${data.last30Days.estimatedInr}`} sub={`≈ $${data.last30Days.estimatedUsd}`} />
          <Card label="Model" value="Claude Haiku 5.5" sub="Set CHAT_MODEL / ANTHROPIC_API_KEY in backend/.env" />
        </div>
      )}
      <Panel title="Recent questions">
        {!data?.logs.length ? (
          <p className="text-sm text-muted">No questions yet{data ? "" : "…"}. They appear here once the assistant has an API key and customers start chatting.</p>
        ) : (
          <ul className="divide-y divide-line/60 text-sm">
            {data.logs.map((l) => (
              <li key={l._id} className="flex flex-wrap justify-between gap-3 py-2.5">
                <span className="max-w-[70%]">{l.question}</span>
                <span className="text-muted">
                  {new Date(l.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })} · ₹{l.estimatedInr}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <div>
        <p className="mb-3 text-lg font-semibold">Knowledge documents</p>
        <ResourceManager config={RESOURCES.knowledge} />
      </div>
    </div>
  );
}

// ---------- Settings ----------

const SETTING_FIELDS: { name: string; label: string; help?: string; type?: "number" }[] = [
  { name: "shopifyUrl", label: "Shopify store URL", help: "Linked from the header and footer" },
  { name: "whatsappNumber", label: "WhatsApp number", help: "International format, digits only — e.g. 919899491916" },
  { name: "whatsappMessage", label: "WhatsApp greeting message" },
  { name: "instagramUrl", label: "Instagram URL" },
  { name: "supportEmail", label: "Support email" },
  { name: "supportPhone", label: "Support phone (display)" },
  { name: "freeShippingAbove", label: "Free delivery above (₹)", type: "number" },
  { name: "shippingFee", label: "Delivery fee (₹)", type: "number" },
];

export function Settings() {
  const { data, error } = useLoad<{ settings: Record<string, unknown> }>("/admin/settings");
  const [msg, setMsg] = useState<string | null>(null);
  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <p className="text-muted">Loading…</p>;
  return (
    <form
      className="max-w-2xl space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = Object.fromEntries(SETTING_FIELDS.map((s) => [s.name, s.type === "number" ? Number(f.get(s.name)) : String(f.get(s.name) ?? "").trim()]));
        try {
          await putJSON("/admin/settings", body);
          setMsg("Saved. Changes appear on the site within a minute.");
        } catch (err) {
          setMsg((err as Error).message);
        }
      }}
    >
      {SETTING_FIELDS.map((s) => (
        <label key={s.name} className="block">
          <span className="text-sm font-medium">{s.label}</span>
          <input name={s.name} type={s.type ?? "text"} defaultValue={String(data.settings?.[s.name] ?? "")} className="field mt-2" />
          {s.help && <span className="mt-1 block text-xs text-muted">{s.help}</span>}
        </label>
      ))}
      {msg && <p className="text-sm text-brand">{msg}</p>}
      <button type="submit" className="btn btn-brand">
        Save settings
      </button>
    </form>
  );
}

export async function syncCatalogue() {
  const r = await postJSON<{ created: number; updated: number }>("/admin/products/sync", {});
  return `Catalogue synced — ${r.created} created, ${r.updated} updated.`;
}
