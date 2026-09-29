import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AuthSwitch } from "@/components/auth/AuthCard";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { HelpCards } from "@/components/storefront/HelpCards";
import { readCallbackUrl, redirectIfSignedIn } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  await redirectIfSignedIn();
  const callbackUrl = readCallbackUrl(await searchParams);

  return (
    <>
      <div className="mx-auto grid max-w-page items-stretch gap-10 px-(--cpad) pt-14 pb-5 lg:grid-cols-[1.05fr_.95fr]">
        <BrandPanel />
        <AuthCard title="Welcome back" subtitle="Sign in to your Covet account to continue.">
          <LoginForm callbackUrl={callbackUrl} />
          <AuthSwitch>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold">
              Create one
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
