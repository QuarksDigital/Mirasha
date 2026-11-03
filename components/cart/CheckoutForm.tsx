"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { postJSON } from "@/lib/client-api";
import { useQuote } from "./useQuote";
import OrderSummary from "./OrderSummary";

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Other",
];

export default function CheckoutForm() {
  const { items, clear, ready } = useCart();
  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const { quote, error, couponError } = useQuote(items, coupon);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const address = user?.addresses?.[0];

  if (orderNumber) {
    return (
      <div className="mt-12 max-w-xl">
        <p className="eyebrow">Order received</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{orderNumber}</p>
        <p className="mt-4 leading-relaxed text-muted">
          Your order is saved as pending payment. The payment gateway (Razorpay) will be connected here in the next phase.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link href="/shop" className="btn btn-brand">
            Continue shopping
          </Link>
          {user && (
            <Link href="/account" className="link text-[17px]">
              View your orders ›
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (ready && items.length === 0) {
    return (
      <div className="mt-10">
        <p className="text-xl text-muted">Your cart is empty.</p>
        <Link href="/shop" className="btn btn-brand mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { order } = await postJSON<{ order: { orderNumber: string } }>("/orders", {
        items: items.map(({ slug, sku, quantity }) => ({ slug, sku, quantity })),
        couponCode: quote?.coupon?.code,
        customer: { name: v("name"), email: v("email"), phone: v("phone") },
        shippingAddress: { line1: v("line1"), line2: v("line2"), city: v("city"), state: v("state"), pincode: v("pincode") },
      });
      clear();
      setOrderNumber(order.orderNumber);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-12 grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-20">
      <div className="space-y-14">
        {!user && (
          <p className="rounded-2xl bg-bone p-4 text-sm text-muted">
            <Link href="/login?next=/checkout" className="link">
              Sign in
            </Link>{" "}
            to track this order and check out faster next time.
          </p>
        )}
        <Fieldset title="Contact information">
          <Field name="name" label="Full name" autoComplete="name" required wide defaultValue={user?.name} key={`n-${user?._id}`} />
          <Field name="email" label="Email" type="email" autoComplete="email" required defaultValue={user?.email} key={`e-${user?._id}`} />
          <Field name="phone" label="Mobile number" type="tel" autoComplete="tel" pattern="[6-9][0-9]{9}" placeholder="10-digit mobile" required defaultValue={user?.phone} key={`p-${user?._id}`} />
        </Fieldset>
        <Fieldset title="Delivery address">
          <Field name="line1" label="House no., building, street" autoComplete="address-line1" required wide defaultValue={address?.line1} key={`l1-${user?._id}`} />
          <Field name="line2" label="Area, landmark (optional)" autoComplete="address-line2" wide defaultValue={address?.line2} key={`l2-${user?._id}`} />
          <Field name="city" label="City" autoComplete="address-level2" required defaultValue={address?.city} key={`c-${user?._id}`} />
          <label className="flex flex-col gap-2">
            <span className="text-sm text-muted">State</span>
            <select name="state" required defaultValue={address?.state ?? ""} key={`s-${user?._id}`} className="field">
              <option value="" disabled>
                Select state
              </option>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <Field name="pincode" label="PIN code" inputMode="numeric" pattern="[1-9][0-9]{5}" autoComplete="postal-code" required defaultValue={address?.pincode} key={`pc-${user?._id}`} />
        </Fieldset>
        <Fieldset title="Payment">
          <p className="rounded-2xl bg-bone p-5 text-sm leading-relaxed text-muted sm:col-span-2">
            UPI, cards, netbanking and cash on delivery will appear here once Razorpay is integrated. Placing the order
            now saves it as “pending payment”.
          </p>
        </Fieldset>
      </div>
      <OrderSummary quote={quote} error={error}>
        <div className="mt-6 border-t border-line pt-5">
          <label htmlFor="coupon" className="text-sm text-muted">
            Coupon code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="coupon"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setCoupon(couponInput.trim());
                }
              }}
              placeholder="WELCOME10"
              className="field !h-11 uppercase"
            />
            <button type="button" onClick={() => setCoupon(couponInput.trim())} className="btn btn-ghost !h-11 !px-4">
              Apply
            </button>
          </div>
          {couponError && <p className="mt-2 text-sm text-red-700">{couponError}</p>}
          {quote?.coupon && (
            <p className="mt-2 text-sm text-brand">
              ✓ {quote.coupon.code} applied{quote.coupon.description ? ` — ${quote.coupon.description}` : ""}
            </p>
          )}
        </div>
        {submitError && <p className="mt-4 rounded-2xl bg-white p-3 text-sm">{submitError}</p>}
        <button type="submit" disabled={submitting || !quote} className="btn btn-brand mt-6 w-full">
          {submitting ? "Placing order…" : "Place order"}
        </button>
      </OrderSummary>
    </form>
  );
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-6 text-2xl font-semibold tracking-tight">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, wide, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="text-sm text-muted">{label}</span>
      <input {...props} className="field" />
    </label>
  );
}
