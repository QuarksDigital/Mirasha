"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteJSON, getJSON, postJSON, putJSON } from "@/lib/client-api";
import { formatPrice } from "@/lib/format";
import type { Field, ResourceConfig } from "./schemas";

type Doc = Record<string, unknown> & { _id: string };

function cell(doc: Doc, col: ResourceConfig["columns"][number]) {
  // products keep price/stock on their first variant
  const variant = Array.isArray(doc.variants) ? (doc.variants[0] as Record<string, unknown>) : undefined;
  const raw = col.name === "price" ? variant?.price : col.name === "stock" ? variant?.stock : doc[col.name];
  if (col.format === "money") return typeof raw === "number" ? formatPrice(raw) : "—";
  if (col.format === "bool") return raw === false ? "No" : raw === undefined ? "—" : "Yes";
  if (col.format === "date") return raw ? String(raw).slice(0, 10) : "—";
  if (raw === undefined || raw === null || raw === "") return "—";
  return String(raw);
}

function toFormValue(field: Field, value: unknown) {
  if (field.type === "list") return Array.isArray(value) ? value.join("\n") : "";
  if (field.type === "json") return value === undefined ? "" : JSON.stringify(value, null, 2);
  if (field.type === "boolean") return Boolean(value);
  return value ?? "";
}

function fromForm(fields: Field[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "list") out[f.name] = String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    else if (f.type === "json") {
      const s = String(v ?? "").trim();
      if (!s) continue;
      try {
        out[f.name] = JSON.parse(s);
      } catch {
        throw new Error(`“${f.label}” isn't valid JSON`);
      }
    } else if (f.type === "number") out[f.name] = v === "" || v === undefined ? undefined : Number(v);
    else if (f.type === "boolean") out[f.name] = Boolean(v);
    else out[f.name] = typeof v === "string" ? v.trim() : v;
  }
  return out;
}

export default function ResourceManager({ config, extraActions }: { config: ResourceConfig; extraActions?: React.ReactNode }) {
  const [items, setItems] = useState<Doc[] | null>(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, unknown> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems((await getJSON<{ items: Doc[] }>(`/admin/${config.key}`)).items);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [config.key]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() sets state after the request resolves
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = q.toLowerCase();
    return (items ?? []).filter((d) => !needle || JSON.stringify(d).toLowerCase().includes(needle));
  }, [items, q]);

  const open = (doc?: Doc) => {
    setError(null);
    const base = doc ?? (config.defaults as Doc);
    setEditing({ id: doc?._id ?? null, values: Object.fromEntries(config.fields.map((f) => [f.name, toFormValue(f, base[f.name])])) });
  };

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const body = { ...(editing.id ? {} : config.defaults), ...fromForm(config.fields, editing.values) };
      if (editing.id) await putJSON(`/admin/${config.key}/${editing.id}`, body);
      else await postJSON(`/admin/${config.key}`, body);
      setEditing(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(doc: Doc) {
    const label = String(doc.name ?? doc.title ?? doc.code ?? doc.url ?? "this item");
    if (!window.confirm(`Delete “${label}”? This can't be undone.`)) return;
    try {
      await deleteJSON(`/admin/${config.key}/${doc._id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const set = (name: string, value: unknown) => setEditing((e) => (e ? { ...e, values: { ...e.values, [name]: value } } : e));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} className="field !h-10 max-w-xs !rounded-full" />
        <div className="flex flex-wrap gap-2">
          {extraActions}
          <button type="button" onClick={() => open()} className="btn btn-brand !h-10">
            + New {config.singular}
          </button>
        </div>
      </div>
      {error && !editing && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line/70 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-bone text-xs uppercase tracking-wide text-muted">
            <tr>
              {config.columns.map((c) => (
                <th key={c.name} className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {items === null ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-8 text-center text-muted">
                  Nothing here yet.
                </td>
              </tr>
            ) : (
              visible.map((d) => (
                <tr key={d._id} className="hover:bg-bone/60">
                  {config.columns.map((c, i) => (
                    <td key={c.name} className={`max-w-[280px] truncate px-4 py-3 ${i === 0 ? "font-medium" : "text-muted"}`}>
                      {cell(d, c)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button type="button" onClick={() => open(d)} className="mr-3 text-brand hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(d)} className="text-red-700 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/30" onClick={() => !saving && setEditing(null)}>
          <div className="flex h-full w-full max-w-2xl flex-col bg-paper shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line/70 px-6 py-4">
              <p className="text-lg font-semibold">
                {editing.id ? "Edit" : "New"} {config.singular}
              </p>
              <button type="button" onClick={() => setEditing(null)} className="text-muted hover:text-ink">
                Close
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6" data-lenis-prevent>
              {config.fields.map((f) => (
                <label key={f.name} className="block">
                  <span className="text-sm font-medium">
                    {f.label}
                    {f.required && <span className="text-red-700"> *</span>}
                  </span>
                  {f.type === "boolean" ? (
                    <span className="mt-2 flex items-center gap-2">
                      <input type="checkbox" checked={Boolean(editing.values[f.name])} onChange={(e) => set(f.name, e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                      <span className="text-sm text-muted">Yes</span>
                    </span>
                  ) : f.type === "select" ? (
                    <select value={String(editing.values[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} className="field mt-2">
                      <option value="">Select…</option>
                      {f.options?.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" || f.type === "list" || f.type === "json" ? (
                    <textarea
                      value={String(editing.values[f.name] ?? "")}
                      onChange={(e) => set(f.name, e.target.value)}
                      rows={f.type === "json" ? 8 : f.type === "list" ? 4 : 4}
                      spellCheck={f.type !== "json"}
                      className={`field mt-2 !h-auto py-3 ${f.type === "json" ? "font-mono text-xs" : ""}`}
                    />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      step="any"
                      value={String(editing.values[f.name] ?? "")}
                      onChange={(e) => set(f.name, e.target.value)}
                      className="field mt-2"
                    />
                  )}
                  {f.help && <span className="mt-1 block text-xs text-muted">{f.help}</span>}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line/70 px-6 py-4">
              <p className="text-sm text-red-700">{error}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost !h-10">
                  Cancel
                </button>
                <button type="button" onClick={save} disabled={saving} className="btn btn-brand !h-10">
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
