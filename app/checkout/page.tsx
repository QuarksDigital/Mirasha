import type { Metadata } from "next";
import CheckoutForm from "@/components/cart/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="pt-24">
      <div className="container-x pb-32 pt-16 md:pt-24">
        <h1 className="headline text-5xl md:text-6xl">Checkout.</h1>
        <CheckoutForm />
      </div>
    </div>
  );
}
