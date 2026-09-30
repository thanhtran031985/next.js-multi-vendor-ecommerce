import Link from "next/link";
import type { ReactNode } from "react";
import { CartIcon, SearchIcon, UserIcon } from "@/components/icons";
import {
  BellIcon,
  CheckSquareIcon,
  GlobeIcon,
  HomeIcon,
  LockIcon,
  MaximizeIcon,
  MessageSquareIcon,
  SettingsIcon,
} from "@/components/icons/dashboard";
import { Breadcrumb, DASHBOARD_CRUMBS } from "@/components/dashboard/Breadcrumb";
import { comingSoonProps } from "@/components/dashboard/coming-soon";
import { ShellFrame } from "@/components/dashboard/ShellFrame";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { UserMenu, type UserMenuItem } from "@/components/dashboard/UserMenu";
import { maskEmail } from "@/lib/dashboard/format";
import type { ShellNav } from "@/lib/dashboard/nav";

type DashboardShellProps = {
  variant: "seller" | "admin";
  nav: ShellNav;
  user: { name: string; email: string };
  /** Seller only: shown in the user-menu header (decisions.md Q4). */
  storeName?: string;
  /**
   * Dark icon rail on the far left. Default true (vendor keeps it). Admin passes false (task 04):
   * the logo then moves to the top of the white sidebar and links to the dashboard.
   */
  showIconRail?: boolean;
  /** Topbar breadcrumb; defaults to Home / Dashboard. Admin pages set it via the @breadcrumb slot (task 03). */
  breadcrumb?: ReactNode;
  children: ReactNode;
};

/**
 * Seller/admin dashboard shell (vendordashboard + AdminDashboard mockups): dark icon rail
 * (optional, see showIconRail), white sidebar with grouped nav and Setup Guide card, topbar with breadcrumb, actions and
 * user menu, content on --bg-dash. Server component; interactivity lives in ShellFrame,
 * SidebarNav and UserMenu.
 */
export function DashboardShell({
  variant,
  nav,
  user,
  storeName,
  showIconRail = true,
  breadcrumb,
  children,
}: DashboardShellProps) {
  const seller = variant === "seller";
  const logoClass = "flex size-9.5 items-center justify-center rounded-md bg-iris-500 text-white";

  const rail =
    showIconRail && nav.rail ? (
      <>
        <span className={`mb-3.5 ${logoClass}`} aria-hidden="true">
          <CartIcon size={20} />
        </span>
        <SidebarNav items={nav.rail} variant="rail" label="Sections" />
      </>
    ) : undefined;

  const sidebar = (
    <>
      {/* No rail: its logo moves here, above "Home", and links to the dashboard. */}
      {!rail && (
        <Link
          href={seller ? "/vendor/dashboard" : "/admin/dashboard"}
          aria-label="Covet dashboard"
          className={`mb-4 ${logoClass} transition-colors hover:bg-iris-600 hover:text-white focus-visible:ring-3 focus-visible:ring-iris-200 focus-visible:outline-none`}
        >
          <CartIcon size={20} />
        </Link>
      )}
      <div className={`flex items-center gap-2.5 border-b border-line-soft px-2 ${seller ? "mb-4 pb-5" : "mb-3.5 pb-4.5"}`}>
        <span className="flex size-8.5 items-center justify-center rounded-md bg-iris-50 text-iris-500">
          <HomeIcon size={18} />
        </span>
        <span className="font-display text-16 leading-none font-bold text-ink">Home</span>
      </div>
      {nav.groups.map((group, i) => (
        // AdminProductList mockup: 14px above each later group label + 6px below the items.
        <div key={group.label} className={i > 0 ? "mt-5" : undefined}>
          <div className="mb-2.5 px-2 text-11 leading-none font-semibold tracking-label text-muted-soft uppercase">
            {group.label}
          </div>
          <SidebarNav items={group.items} variant="sidebar" label={group.label} />
        </div>
      ))}
      <SetupGuideCard />
    </>
  );

  const menuItems: UserMenuItem[] = seller
    ? [
        { label: "Profile Setting", icon: <UserIcon size={17} strokeWidth={1.9} /> },
        { label: "Change Password", icon: <LockIcon size={17} strokeWidth={1.9} /> },
      ]
    : [
        { label: "Profile", icon: <UserIcon size={17} strokeWidth={1.9} /> },
        { label: "Settings", icon: <SettingsIcon size={17} strokeWidth={1.9} /> },
      ];

  const topbar = (
    <>
      {breadcrumb ?? <Breadcrumb items={DASHBOARD_CRUMBS} />}

      {!seller && (
        <div
          className="ml-3.5 hidden h-10 max-w-105 flex-1 cursor-not-allowed items-center overflow-hidden rounded-md border border-line bg-field lg:flex"
          {...comingSoonProps}
        >
          <span className="px-3 text-muted-soft">
            <SearchIcon size={16} />
          </span>
          <input
            disabled
            aria-label="Search menu"
            placeholder="Search Menu..."
            className="min-w-0 flex-1 cursor-not-allowed bg-transparent px-1 text-13 leading-none text-ink outline-none"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {seller && (
          <TopbarButton label="Visit store">
            <GlobeIcon size={18} strokeWidth={1.9} />
          </TopbarButton>
        )}
        <TopbarButton label="Notifications">
          <BellIcon size={18} strokeWidth={1.9} />
        </TopbarButton>
        <TopbarButton label="Messages">
          <MessageSquareIcon size={18} strokeWidth={1.9} />
        </TopbarButton>
        <TopbarButton label="Fullscreen">
          <MaximizeIcon size={17} />
        </TopbarButton>
        <UserMenu
          pillTitle={seller ? firstWord(user.name) : user.name}
          pillSubtitle={seller ? maskEmail(user.email) : "Master Admin"}
          name={user.name}
          email={user.email}
          detail={storeName}
          items={menuItems}
          width={variant}
        />
      </div>
    </>
  );

  return (
    <ShellFrame rail={rail} sidebar={sidebar} topbar={topbar} contentWidth={variant}>
      {children}
    </ShellFrame>
  );
}

/** 38px outlined icon button. No feature behind any of them yet: disabled, "Coming soon". */
function TopbarButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span
      role="button"
      aria-label={label}
      className="hidden size-9.5 cursor-not-allowed items-center justify-center rounded-md border border-line bg-surface text-muted opacity-60 sm:flex"
      {...comingSoonProps}
    >
      {children}
    </span>
  );
}

/** Sidebar "Setup Guide" card. No onboarding data yet, so no progress figure (decisions.md). */
function SetupGuideCard() {
  return (
    <div className="mt-5.5 rounded-lg bg-linear-135 from-iris-500 to-iris-700 p-4 text-white" {...comingSoonProps}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-8.5 flex-none items-center justify-center rounded-md bg-white/16">
          <CheckSquareIcon size={18} />
        </span>
        <div>
          <div className="font-display text-13 leading-none font-semibold">Setup Guide</div>
          <div className="mt-1.25 text-11 leading-none text-white/75">Coming soon</div>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20" />
    </div>
  );
}

function firstWord(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
