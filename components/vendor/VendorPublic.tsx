// Static sections of the public vendor registration page (VendorRegister mockup).

import Link from "next/link";
import type { ComponentType } from "react";
import {
  AppleIcon,
  CartIcon,
  FileIcon,
  HeadsetIcon,
  MegaphoneIcon,
  MinusIcon,
  PlayStoreIcon,
  PlusIcon,
  RocketIcon,
  SearchIcon,
  UploadIcon,
} from "@/components/icons";
import { FooterLinks } from "@/components/storefront/StorefrontChrome";
import { Wordmark } from "@/components/Wordmark";

type IconType = ComponentType<{ size?: number; strokeWidth?: number }>;

export const marketingContainer = "mx-auto max-w-marketing px-8";

export function VendorPublicHeader() {
  const link = "flex h-9.5 items-center rounded-sm px-3.5 text-13-5 leading-none font-medium text-ink-soft hover:text-iris-500";
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-surface">
      <div className={`${marketingContainer} flex h-18 items-center gap-7`}>
        <Link href="/" className="flex-none text-ink hover:text-ink" aria-label="Covet home">
          <Wordmark className="text-26" />
        </Link>
        <nav className="ml-2 hidden items-center gap-1.5 md:flex" aria-label="Main">
          <Link href="/" className={link}>
            Home
          </Link>
          <a href="#" className={link}>
            Brands
          </a>
          <a href="#" className={link}>
            Offers
          </a>
          <a href="#" className={link}>
            All Sellers
          </a>
          <a href="#" className={link}>
            Gift Cards
          </a>
        </nav>
        <Link
          href="/vendor/login"
          className="ml-auto flex h-11 items-center gap-2 rounded-md bg-iris-500 px-5.5 font-display text-13 leading-none font-bold text-white transition-colors hover:bg-iris-600 hover:text-white"
        >
          Vendor Login
        </Link>
      </div>
    </header>
  );
}

const perks: { title: string; desc: string; Icon: IconType }[] = [
  {
    title: "Easy Onboarding",
    desc: "Start selling quickly with our user-friendly onboarding process designed to get you up and running fast.",
    Icon: RocketIcon,
  },
  {
    title: "24/7 Support",
    desc: "Get round-the-clock support from our dedicated team to resolve any issues and assist you anytime.",
    Icon: HeadsetIcon,
  },
  {
    title: "SEO Friendly",
    desc: "Enjoy enhanced search visibility with our SEO-friendly platform, driving more traffic to your listings.",
    Icon: SearchIcon,
  },
  {
    title: "Free Marketing",
    desc: "Benefit from our extensive, no-cost marketing efforts to boost your visibility and sales.",
    Icon: MegaphoneIcon,
  },
];

const steps: { title: string; desc: string; Icon: IconType }[] = [
  {
    title: "Get Registered",
    desc: "Sign up easily and create your seller account in just a few minutes. It’s fast and simple to get started.",
    Icon: FileIcon,
  },
  {
    title: "Upload Products",
    desc: "List your products with detailed descriptions and high-quality images to attract more buyers effortlessly.",
    Icon: UploadIcon,
  },
  {
    title: "Start Selling",
    desc: "Go live and start reaching millions of potential buyers immediately. Watch your sales grow.",
    Icon: CartIcon,
  },
];

const faqs = [
  {
    q: "How do I register as a seller?",
    a: "Fill in the Create An Account form above with your name, store name, email and a password. Our team reviews every new store, and you can start listing products as soon as yours is approved.",
  },
  {
    q: "How do I upload products?",
    a: "Once your store is approved, use Add New Product in your seller dashboard to add product details, images, pricing and inventory.",
  },
  {
    q: "What are the fees for selling?",
    a: "Covet charges a small per-order commission that varies by category. There are no listing or monthly subscription fees.",
  },
  {
    q: "How do I handle customer inquiries?",
    a: "Customer questions come through the Covet AI support agent and your seller inbox, so you can respond quickly from one place.",
  },
  {
    q: "When and how do I get paid?",
    a: "Completed order earnings accumulate in your Vendor Wallet and can be withdrawn to your connected Stripe account on your payout schedule.",
  },
];

const sectionTitle = "m-0 font-display text-30 leading-110 font-extrabold tracking-heading";
const sectionLead = "mt-3.5 text-15 leading-150";

export function WhySellWithUs() {
  return (
    <section className={`${marketingContainer} pt-16 text-center`}>
      <h2 className={`${sectionTitle} text-ink`}>Why Sell With Us</h2>
      <p className={`${sectionLead} mb-10 text-muted`}>Boost your sales! Join us for a seamless, profitable selling experience.</p>
      <div className="grid gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
        {perks.map(({ title, desc, Icon }) => (
          <div
            key={title}
            className="rounded-xl border border-line-soft bg-surface px-6 py-6.5 shadow-xs transition-[box-shadow,transform] duration-250 hover:-translate-y-0.75 hover:shadow-md"
          >
            <span className="mb-4.5 flex size-13 items-center justify-center rounded-lg bg-iris-50 text-iris-500">
              <Icon size={24} strokeWidth={1.8} />
            </span>
            <div className="font-display text-16 leading-120 font-bold text-ink">{title}</div>
            <div className="mt-2.5 text-13 leading-150 text-muted">{desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EasySteps() {
  return (
    <section className="mt-16 bg-linear-120 from-iris-900 to-iris-700">
      <div className={`${marketingContainer} py-14 text-center`}>
        <h2 className={`${sectionTitle} text-white`}>3 Easy Steps To Start Selling</h2>
        <p className={`${sectionLead} mx-auto mb-11 max-w-130 text-white/75`}>
          Register, upload your products with detailed info and images, and reach millions of buyers instantly.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map(({ title, desc, Icon }) => (
            <div key={title}>
              <span className="mx-auto mb-4.5 flex size-16 items-center justify-center rounded-xl bg-white/12 text-white">
                <Icon size={24} strokeWidth={1.8} />
              </span>
              <div className="font-display text-18 leading-120 font-bold text-white">{title}</div>
              <div className="mx-auto mt-2.5 max-w-70 text-13 leading-160 text-white/72">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AppDownload() {
  const badge = "flex h-12 items-center gap-2.25 rounded-md bg-ink px-4.5 text-white";
  return (
    <section className={`${marketingContainer} pt-14`}>
      <div className="grid items-center gap-10 rounded-2xl border border-iris-100 bg-iris-50 px-11 py-10 md:grid-cols-[17.5rem_1fr]">
        <div className="mx-auto h-65 w-45 overflow-hidden rounded-3xl border-6 border-ink bg-ink">
          <div className="flex size-full items-center justify-center rounded-2xl bg-linear-160 from-iris-500 to-iris-900 font-mono text-11 leading-140 text-white/60">
            app mockup
          </div>
        </div>
        <div>
          <h2 className="m-0 font-display text-26 leading-115 font-extrabold tracking-heading text-ink">
            Download Free Vendor App
          </h2>
          <p className="mt-3.5 mb-6 max-w-115 text-14 leading-160 text-muted">
            Download our free seller app and start reaching millions of buyers on the go. Easy setup, manage listings,
            and boost sales anywhere.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className={badge}>
              <PlayStoreIcon />
              <span>
                <span className="block text-8 leading-none text-white/70">GET IT ON</span>
                <span className="mt-0.5 block text-13 leading-120 font-semibold">Google Play</span>
              </span>
            </span>
            <span className={badge}>
              <AppleIcon />
              <span>
                <span className="block text-8 leading-none text-white/70">Download on the</span>
                <span className="mt-0.5 block text-13 leading-120 font-semibold">App Store</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function VendorFaq() {
  return (
    <section className="mx-auto max-w-faq px-8 pt-16 text-center">
      <h2 className={`${sectionTitle} text-ink`}>Frequently Asked Questions</h2>
      <p className={`${sectionLead} mb-9 text-muted`}>
        Got questions about becoming a vendor? Explore our FAQ for answers to common queries about joining our platform.
      </p>
      <div className="flex flex-col gap-3 text-left">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group overflow-hidden rounded-lg border border-line-soft bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5.5 py-4.5 [&::-webkit-details-marker]:hidden">
              <span className="text-14-5 leading-130 font-semibold text-ink">{q}</span>
              <span className="flex size-7.5 flex-none items-center justify-center rounded-sm bg-field-muted text-muted group-open:bg-iris-500 group-open:text-white">
                <PlusIcon className="group-open:hidden" />
                <MinusIcon className="hidden group-open:block" />
              </span>
            </summary>
            <div className="px-5.5 pb-5 text-13-5 leading-160 text-muted">{a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function VendorFooter() {
  const link = "text-on-dark-subtle hover:text-white";
  return (
    <footer className="mt-16 bg-ink text-on-dark-muted">
      <div className={`${marketingContainer} grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]`}>
        <div>
          <Wordmark className="mb-4 block text-24 text-white" dotClassName="text-iris-400" />
          <p className="m-0 max-w-65 text-13 leading-160 text-on-dark-subtle">
            A curated multi-vendor marketplace bringing independent sellers and beloved brands under one trusted
            checkout.
          </p>
        </div>
        <FooterLinks
          title="Quick Links"
          links={["Profile Info", "Featured Products", "Best Selling", "Track Order"]}
          linkClass={link}
          compact
        />
        <FooterLinks
          title="Other"
          links={["About Us", "Terms & Conditions", "Privacy Policy", "Return Policy"]}
          linkClass={link}
          compact
        />
        <div>
          <div className="mb-4 font-display text-14 leading-none font-semibold text-white">Newsletter</div>
          <p className="mb-3.5 text-13 leading-150 text-on-dark-subtle">Subscribe to our channel to get latest updates.</p>
          <div className="flex h-11.5 overflow-hidden rounded-control border border-white/12 bg-white/6">
            <input
              type="email"
              aria-label="Your email address"
              placeholder="Your Email Address"
              className="min-w-0 flex-1 bg-transparent px-3.5 text-13 leading-none text-white outline-none"
            />
            <button
              type="button"
              className="bg-iris-500 px-4.5 text-13 leading-none font-semibold text-white transition-colors hover:bg-iris-600"
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/8 px-8 py-5.5 text-center text-12-5 leading-none text-on-dark-faint">
        © 2026 Covet Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
