import type { Metadata } from "next";
import CartView from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="pt-24">
      <div className="container-x pb-32 pt-16 md:pt-24">
        <h1 className="headline text-5xl md:text-6xl">Your cart.</h1>
        <CartView />
      </div>
    </div>
  );
}
