import type { ReactNode } from "react";
import { UserIcon } from "@/components/icons";
import { AccountFrame } from "@/components/dashboard/AccountFrame";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { SignOutItem } from "@/components/dashboard/SignOutItem";
import { HelpCards } from "@/components/storefront/HelpCards";
import { MegaNav, StorefrontFooter, StorefrontHeader, UtilityBar } from "@/components/storefront/StorefrontChrome";
import type { NavItem } from "@/lib/dashboard/nav";

/**
 * Customer dashboard shell (userdashboard mockup, DESIGN_SYSTEM §9): storefront chrome +
 * breadcrumb + account sidebar (user card, nav, Sign out) + white content card + help cards.
 */
export function AccountShell({
  user,
  nav,
  children,
}: {
  user: { name: string; email: string };
  nav: NavItem[];
  children: ReactNode;
}) {
  const sidebar = (
    <>
      <div className="mb-2 flex items-center gap-3.25 border-b border-line-soft px-3 pt-3 pb-4">
        <span className="flex size-11.5 flex-none items-center justify-center rounded-lg bg-linear-135 from-iris-100 to-iris-50 text-iris-500">
          <UserIcon size={24} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <div className="truncate font-display text-15 leading-110 font-bold text-ink">{user.name}</div>
          <div className="mt-1.25 truncate text-12 leading-none text-muted-soft">{user.email}</div>
        </div>
      </div>
      <SidebarNav items={nav} variant="account" label="Account" />
      <div className="mt-2.5 border-t border-line-soft px-3 py-3.5">
        <SignOutItem
          label="Sign out"
          iconSize={18}
          className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-13-5 leading-none font-semibold text-error-solid transition-colors duration-150 hover:bg-error-bg focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none disabled:cursor-not-allowed"
        />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <UtilityBar />
      <StorefrontHeader user={user} />
      <MegaNav />
      <main className="flex-1">
        <AccountFrame sidebar={sidebar}>{children}</AccountFrame>
        <section className="mx-auto max-w-page px-(--cpad) pt-14">
          <HelpCards />
        </section>
      </main>
      <StorefrontFooter />
    </div>
  );
}
