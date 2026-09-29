"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMING_SOON, comingSoonProps } from "@/components/dashboard/coming-soon";
import { NavIcon } from "@/components/dashboard/NavIcon";
import { isActiveHref, type NavItem } from "@/lib/dashboard/nav";

type Variant = "rail" | "sidebar" | "account";

/**
 * Renders a list of nav items from lib/dashboard/nav.ts.
 * - rail: 40px icon buttons on the dark seller/admin rail (label as aria-label + tooltip)
 * - sidebar: rows in the white seller/admin sidebar
 * - account: icon-chip rows in the customer account sidebar
 * Disabled items are not links: dimmed, aria-disabled, "Coming soon" tooltip.
 */
export function SidebarNav({ items, variant, label }: { items: NavItem[]; variant: Variant; label: string }) {
  const pathname = usePathname();
  const activeHref = findActiveHref(items, pathname, variant === "rail");

  return (
    <nav aria-label={label}>
      <ul className={listClass[variant]}>
        {items.map((item) => (
          <li key={item.href}>
            <NavEntry item={item} variant={variant} active={item.href === activeHref} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

const listClass: Record<Variant, string> = {
  rail: "flex flex-col items-center gap-2",
  sidebar: "flex flex-col gap-0.75",
  account: "flex flex-col gap-0.5",
};

/** Exact match for sidebar/account rows; for the rail, the longest enabled section prefix. */
function findActiveHref(items: NavItem[], pathname: string, section: boolean): string | null {
  let best: string | null = null;
  for (const item of items) {
    if (!item.enabled || !isActiveHref(pathname, item.href, section)) continue;
    if (!best || item.href.length > best.length) best = item.href;
  }
  return best;
}

function NavEntry({ item, variant, active }: { item: NavItem; variant: Variant; active: boolean }) {
  const content = <EntryContent item={item} variant={variant} active={active} />;
  const className = `${entryClass[variant](active)} ${item.enabled ? "" : "cursor-not-allowed opacity-50"}`;

  if (!item.enabled) {
    return (
      <span
        role="link"
        className={className}
        aria-label={variant === "rail" ? item.label : undefined}
        {...comingSoonProps}
        title={variant === "rail" ? `${item.label} — ${COMING_SOON}` : COMING_SOON}
      >
        {content}
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      className={className}
      aria-current={active ? "page" : undefined}
      aria-label={variant === "rail" ? item.label : undefined}
      title={variant === "rail" ? item.label : undefined}
    >
      {content}
    </Link>
  );
}

const focusRing = "focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none";

const entryClass: Record<Variant, (active: boolean) => string> = {
  rail: (active) =>
    `flex size-10 items-center justify-center rounded-md transition-all duration-180 ${focusRing} ${
      active ? "bg-iris-500 text-white hover:text-white" : "text-on-dark-subtle hover:text-white"
    }`,
  sidebar: (active) =>
    `flex items-center gap-2.75 rounded-md px-3 py-2.5 text-13-5 leading-none transition-colors duration-150 ${focusRing} ${
      active ? "bg-iris-50 font-semibold text-iris-500 hover:text-iris-500" : "font-medium text-ink-soft hover:text-ink-soft"
    }`,
  account: (active) =>
    `flex items-center gap-3 rounded-md px-3.5 py-2.75 text-13-5 leading-none transition-colors duration-150 ${focusRing} ${
      active ? "bg-iris-50 font-semibold text-iris-500 hover:text-iris-500" : "font-medium text-ink-soft hover:text-ink-soft"
    }`,
};

function EntryContent({ item, variant, active }: { item: NavItem; variant: Variant; active: boolean }) {
  if (variant === "rail") return <NavIcon name={item.icon} size={20} />;
  if (variant === "sidebar") {
    return (
      <>
        <span className="flex">
          <NavIcon name={item.icon} size={17} />
        </span>
        <span>{item.label}</span>
      </>
    );
  }
  return (
    <>
      <span
        className={`flex size-7.5 flex-none items-center justify-center rounded-md ${
          active ? "bg-iris-500 text-white" : "bg-field-muted text-muted-strong"
        }`}
      >
        <NavIcon name={item.icon} size={18} />
      </span>
      <span className="flex-1">{item.label}</span>
    </>
  );
}
