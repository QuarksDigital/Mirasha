import type { Quote } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export default function OrderSummary({ quote, error, children }: { quote: Quote | null; error: string | null; children?: React.ReactNode }) {
  return (
    <aside className="h-fit rounded-[28px] bg-bone p-7 lg:sticky lg:top-24">
      <h2 className="text-xl font-semibold tracking-tight">Summary</h2>
      {error ? (
        <p className="mt-5 rounded-2xl bg-white p-4 text-sm">{error}</p>
      ) : !quote ? (
        <p className="mt-5 text-muted">Calculating…</p>
      ) : (
        <dl className="mt-5 space-y-3 text-[15px]">
          <Row label="Subtotal" value={formatPrice(quote.subtotal)} />
          {quote.discount > 0 && <Row label={`Coupon ${quote.coupon?.code ?? ""}`} value={`−${formatPrice(quote.discount)}`} accent />}
          <Row label="Delivery" value={quote.shipping === 0 ? "Free" : formatPrice(quote.shipping)} />
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <dt className="font-semibold">Total</dt>
            <dd className="text-2xl font-semibold tracking-tight">{formatPrice(quote.total)}</dd>
          </div>
          <p className="text-xs text-muted">Inclusive of GST</p>
        </dl>
      )}
      {children}
      <p className="mt-4 text-center text-xs text-muted">UPI · Cards · Netbanking · Cash on delivery</p>
    </aside>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "font-medium text-brand" : undefined}>{value}</dd>
    </div>
  );
}
