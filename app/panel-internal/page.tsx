import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

// Reached only through the secret ADMIN_PATH rewrite in proxy.ts (direct requests 404).
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminApp />;
}
