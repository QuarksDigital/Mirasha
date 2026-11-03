import type { Metadata } from "next";
import AccountView from "@/components/account/AccountView";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="pt-24">
      <div className="container-x pb-32 pt-14 md:pt-20">
        <AccountView />
      </div>
    </div>
  );
}
