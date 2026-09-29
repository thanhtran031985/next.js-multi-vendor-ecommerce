import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthSwitch } from "@/components/auth/AuthCard";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { CustomerRegisterForm } from "@/components/auth/CustomerRegisterForm";
import { HelpCards } from "@/components/storefront/HelpCards";
import { redirectIfSignedIn } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage() {
  await redirectIfSignedIn();

  return (
    <>
      <div className="mx-auto grid max-w-page items-stretch gap-10 px-(--cpad) pt-14 pb-5 lg:grid-cols-[1.05fr_.95fr]">
        <BrandPanel />
        <AuthCard title="Create your account" subtitle="Join Covet to shop across thousands of sellers.">
          <CustomerRegisterForm />
          <AuthSwitch>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold">
              Sign in
            </Link>
          </AuthSwitch>
        </AuthCard>
      </div>
      <section className="mx-auto max-w-page px-(--cpad) pt-14">
        <HelpCards />
      </section>
    </>
  );
}
