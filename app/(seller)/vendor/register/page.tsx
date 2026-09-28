import type { Metadata } from "next";
import Link from "next/link";
import { VendorRegisterForm } from "@/components/auth/VendorRegisterForm";
import { HelpCards } from "@/components/storefront/HelpCards";
import {
  AppDownload,
  EasySteps,
  marketingContainer,
  VendorFaq,
  VendorFooter,
  VendorPublicHeader,
  WhySellWithUs,
} from "@/components/vendor/VendorPublic";
import { redirectIfSignedIn } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Vendor registration" };

export default async function VendorRegisterPage() {
  await redirectIfSignedIn();

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <VendorPublicHeader />
      <main className="flex-1">
        <section className="border-b border-line-soft bg-linear-120 from-iris-50 to-iris-25">
          <div className={`${marketingContainer} grid items-center gap-10 py-12 lg:grid-cols-[21.25rem_1fr]`}>
            <div>
              <h1 className="m-0 font-display text-30 leading-110 font-extrabold tracking-heading text-ink">
                Vendor Registration
              </h1>
              <p className="mt-3.5 mb-5 text-14 leading-150 text-muted">
                Create your own store. Already have a store?{" "}
                <Link href="/vendor/login" className="font-semibold">
                  Login
                </Link>
              </p>
              <div className="relative hidden aspect-4/3 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-placeholder-border bg-placeholder-bg lg:flex">
                <div aria-hidden="true" className="placeholder-hatch absolute inset-0" />
                <span className="relative font-mono text-12 leading-140 font-medium text-muted-soft">
                  seller illustration
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-line-soft bg-surface px-6 py-7.5 shadow-form sm:px-8">
              <h2 className="m-0 mb-5.5 font-display text-19 leading-none font-bold text-ink">Create An Account</h2>
              <VendorRegisterForm />
            </div>
          </div>
        </section>
        <WhySellWithUs />
        <EasySteps />
        <AppDownload />
        <VendorFaq />
        <section className={`${marketingContainer} pt-14`}>
          <HelpCards compact />
        </section>
      </main>
      <VendorFooter />
    </div>
  );
}
