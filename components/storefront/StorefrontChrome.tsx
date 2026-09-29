// Static storefront shell (utility bar, header, mega nav, footer) from login/register mockups.
// Search, the category mega-menu and the cart popover are not wired up yet: they render in
// their resting state only.

import Link from "next/link";
import {
  CartIcon,
  ChevronDownIcon,
  FacebookIcon,
  GridIcon,
  HeartIcon,
  InstagramIcon,
  MapPinIcon,
  PackageIcon,
  SearchIcon,
  TruckIcon,
  UserIcon,
  XLogoIcon,
} from "@/components/icons";
import { Wordmark } from "@/components/Wordmark";

const container = "mx-auto max-w-page px-(--cpad)";

export function UtilityBar() {
  const link = "text-on-dark-soft hover:text-white";
  return (
    <div className="bg-ink text-on-dark-soft">
      <div className={`${container} flex h-10 items-center justify-between text-12-5 leading-none`}>
        <div className="flex items-center gap-2">
          <TruckIcon size={14} className="text-iris-400" />
          <span>
            Free delivery on orders over <span className="font-semibold text-white">$50</span>
          </span>
        </div>
        <nav className="hidden items-center gap-6.5 md:flex" aria-label="Utility">
          <Link href="/" className={link}>
            Home
          </Link>
          <a href="#" className={link}>
            All Sellers
          </a>
          <Link href="/vendor/register" className={link}>
            Sell on Covet
          </Link>
          <a href="#" className={link}>
            Help Center
          </a>
        </nav>
      </div>
    </div>
  );
}

/**
 * `user`: signed-in customer (dashboard pages) -> "Hello, <first name> / Dashboard" linking to
 * /dashboard. Without it the header shows the guest "Sign in" link (task 02 decisions Q2).
 */
export function StorefrontHeader({ user }: { user?: { name: string } } = {}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-surface">
      <div className={`${container} flex h-20 items-center gap-7`}>
        <Link href="/" className="flex-none text-ink hover:text-ink" aria-label="Covet home">
          <Wordmark className="text-27" />
        </Link>

        <div
          role="search"
          className="hidden h-12 flex-1 items-center rounded-control border border-line bg-field transition-[border-color,box-shadow] duration-200 focus-within:border-iris-500 focus-within:ring-3 focus-within:ring-iris-100 md:flex"
        >
          <span className="flex h-full items-center gap-1.5 border-r border-line-strong px-4 text-13 leading-none font-medium whitespace-nowrap text-ink-soft">
            All Categories
            <ChevronDownIcon size={15} className="text-muted" />
          </span>
          <input
            type="search"
            aria-label="Search for items"
            placeholder="Search for items…"
            className="h-full min-w-0 flex-1 bg-transparent px-4 text-14 leading-none text-ink outline-none"
          />
          <button
            type="button"
            aria-label="Search"
            className="flex h-full items-center justify-center rounded-r-md bg-iris-500 px-5 text-white transition-colors hover:bg-iris-600"
          >
            <SearchIcon size={19} />
          </button>
        </div>

        <div className="ml-auto flex flex-none items-center gap-2 md:ml-0">
          <span className="hidden flex-col items-center gap-0.75 rounded-md px-2.5 py-1.5 text-ink-soft sm:flex">
            <HeartIcon size={21} />
            <span className="text-11 leading-none font-medium text-muted">Wishlist</span>
          </span>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-field"
          >
            <span className="flex size-9.5 items-center justify-center rounded-full bg-linear-135 from-iris-100 to-iris-50 text-iris-500">
              <UserIcon size={20} />
            </span>
            <span className="hidden text-left sm:block">
              <span className="mb-0.75 block text-11 leading-none text-muted">
                {`Hello, ${user ? user.name.trim().split(/\s+/)[0] : "Guest"}`}
              </span>
              {user ? (
                <span className="flex items-center gap-1 font-display text-13 leading-none font-semibold text-ink">
                  Dashboard
                  <ChevronDownIcon size={14} className="text-muted" />
                </span>
              ) : (
                <span className="block font-display text-13 leading-none font-semibold text-ink">Sign in</span>
              )}
            </span>
          </Link>
          <span className="ml-1.5 flex items-center gap-3 rounded-control border border-iris-100 bg-iris-50 py-2.25 pr-3.5 pl-3">
            <span className="relative text-iris-500">
              <CartIcon size={23} />
              <span className="absolute -top-1.75 -right-2 h-4.5 min-w-4.5 rounded-full bg-iris-500 px-1 text-center text-10 leading-4.5 font-semibold text-white">
                0
              </span>
            </span>
            <span className="hidden text-left sm:block">
              <span className="mb-0.75 block text-11 leading-none text-muted">My cart</span>
              <span className="block font-display text-14 leading-none font-bold text-ink">$0.00</span>
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

export function MegaNav() {
  const link = "flex h-9.5 items-center rounded-sm px-3.5 text-13-5 leading-none font-medium text-ink-soft hover:text-iris-500";
  return (
    <nav className="hidden border-b border-line-soft bg-surface lg:block" aria-label="Main">
      <div className={`${container} flex h-13.5 items-center gap-2`}>
        <span className="mr-3.5 flex h-9.5 items-center gap-2.5 rounded-md bg-ink px-4.5 text-13-5 leading-none font-semibold text-white">
          <GridIcon size={17} />
          All Categories
          <ChevronDownIcon size={15} />
        </span>
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
        <Link
          href="/vendor/register"
          className="ml-auto flex items-center gap-2 text-13 leading-none font-medium text-success-solid hover:text-success"
        >
          <PackageIcon size={16} />
          Sell on Covet — open a store free
        </Link>
      </div>
    </nav>
  );
}

export function StorefrontFooter() {
  const link = "text-on-dark-subtle hover:text-white";
  const social =
    "flex size-9.5 items-center justify-center rounded-md bg-white/6 text-on-dark-muted transition-colors hover:bg-iris-500 hover:text-white";
  return (
    <footer className="mt-14 bg-ink text-on-dark-muted">
      <div className={`${container} grid gap-10 pt-15 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]`}>
        <div>
          <Wordmark className="mb-4 block text-26 text-white" dotClassName="text-iris-400" />
          <p className="mb-5 max-w-70 text-13-5 leading-160 text-on-dark-subtle">
            A curated multi-vendor marketplace bringing independent sellers and beloved brands under one trusted
            checkout.
          </p>
          <div className="flex gap-2.5">
            <a href="#" aria-label="Facebook" className={social}>
              <FacebookIcon />
            </a>
            <a href="#" aria-label="Instagram" className={social}>
              <InstagramIcon />
            </a>
            <a href="#" aria-label="X" className={social}>
              <XLogoIcon />
            </a>
          </div>
        </div>
        <FooterLinks title="Quick Links" links={["Profile Info", "Wish List", "Featured Products", "Best Selling", "Track Order"]} linkClass={link} />
        <FooterLinks title="Other" links={["About Us", "Terms & Conditions", "Privacy Policy", "Refund Policy", "Return Policy"]} linkClass={link} />
        <div>
          <div className="mb-4.5 font-display text-14 leading-none font-semibold text-white">Newsletter</div>
          <p className="mb-3.5 text-13 leading-150 text-on-dark-subtle">
            Subscribe to get the latest updates and members-only deals.
          </p>
          <div className="flex h-11.5 overflow-hidden rounded-control border border-white/12 bg-white/6">
            <input
              type="email"
              aria-label="Your email address"
              placeholder="Your email address"
              className="min-w-0 flex-1 bg-transparent px-3.5 text-13-5 leading-none text-white outline-none"
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
      <div
        className={`${container} mt-11 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-7 pb-8.5`}
      >
        <div className="flex items-center gap-2 text-13 leading-none text-on-dark-subtle">
          <MapPinIcon size={15} className="text-iris-400" />
          Kingston, New York 12401, United States
        </div>
        <div className="text-12-5 leading-none text-on-dark-faint">© 2026 Covet Marketplace. All rights reserved.</div>
      </div>
    </footer>
  );
}

/** Footer link column. `compact` = vendor register footer (tighter spacing, 13px links). */
export function FooterLinks({
  title,
  links,
  linkClass,
  compact = false,
}: {
  title: string;
  links: string[];
  linkClass: string;
  compact?: boolean;
}) {
  return (
    <div>
      <div className={`font-display text-14 leading-none font-semibold text-white ${compact ? "mb-4" : "mb-4.5"}`}>
        {title}
      </div>
      <ul className={`flex flex-col leading-none ${compact ? "gap-2.75 text-13" : "gap-3 text-13-5"}`}>
        {links.map((label) => (
          <li key={label}>
            <a href="#" className={linkClass}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
