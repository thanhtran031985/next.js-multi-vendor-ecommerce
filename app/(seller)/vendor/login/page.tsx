import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { CartIcon } from "@/components/icons";
import { Wordmark } from "@/components/Wordmark";
import { readCallbackUrl, redirectIfSignedIn } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Vendor sign in" };

export default async function VendorLoginPage({ searchParams }: PageProps<"/vendor/login">) {
  await redirectIfSignedIn();
  const callbackUrl = readCallbackUrl(await searchParams);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden bg-bg-dash px-[7%] py-16 lg:flex">
        <Link href="/" aria-label="Covet home" className="mb-15 flex items-center gap-3 text-ink hover:text-ink">
          <span className="flex size-11 items-center justify-center rounded-lg bg-iris-500 text-white">
            <CartIcon size={24} />
          </span>
          <Wordmark className="text-30" />
        </Link>
        <p className="m-0 max-w-140 font-display text-56 leading-105 font-extrabold tracking-display text-ink">
          Make Your Business <span className="text-iris-500">Profitable...</span>
        </p>
        <p className="mt-6.5 mb-10 max-w-110 text-16 leading-160 text-muted">
          Reach thousands of shoppers across the Covet marketplace. Set up your store, list products, and grow — all
          from one seller dashboard.
        </p>
        <div className="relative flex aspect-video w-full max-w-130 items-center justify-center overflow-hidden rounded-xl border border-dashed border-placeholder-border bg-placeholder-bg">
          <div aria-hidden="true" className="placeholder-hatch absolute inset-0" />
          <span className="relative px-6 text-center font-mono text-12 leading-140 font-medium text-muted-soft">
            seller lifestyle image
          </span>
        </div>
      </div>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-[7%] py-12">
        <div className="w-full max-w-110">
          <Link href="/" aria-label="Covet home" className="mb-10 inline-block text-ink hover:text-ink lg:hidden">
            <Wordmark className="text-26" />
          </Link>
          <h1 className="m-0 font-display text-30 leading-none font-extrabold tracking-heading text-ink">Sign in</h1>
          <p className="mt-4 mb-9 text-15 leading-none font-semibold text-ink">Welcome back to Vendor Login</p>
          <LoginForm
            variant="vendor"
            callbackUrl={callbackUrl}
            beforeSubmit={
              <div className="mt-5.5 mb-7 flex justify-end">
                <Link href="/vendor/register" className="text-13 leading-none font-semibold">
                  Register New Account
                </Link>
              </div>
            }
          />
        </div>
      </main>
    </div>
  );
}
