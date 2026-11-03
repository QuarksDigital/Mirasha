import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/account/AuthForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="flex min-h-[90svh] items-center pb-24 pt-28">
      <div className="container-x">
        <Suspense fallback={<div className="mx-auto h-[520px] max-w-md animate-pulse rounded-[36px] bg-bone" />}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
