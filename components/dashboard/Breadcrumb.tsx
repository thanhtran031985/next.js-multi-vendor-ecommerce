import Link from "next/link";
import { Fragment } from "react";
import { ChevronRightIcon } from "@/components/icons/dashboard";

export type Crumb = { label: string; href?: string };

/** Default trail of the dashboards (vendordashboard mockup): Home / Dashboard. */
export const DASHBOARD_CRUMBS: Crumb[] = [{ label: "Home", href: "/" }, { label: "Dashboard" }];

/**
 * Topbar breadcrumb of the seller/admin shell. Links in iris, current page (last item) muted.
 * Admin pages set their own trail through the layout's @breadcrumb slot (task 03).
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-13 leading-none font-medium sm:flex">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={`${i}-${item.label}`}>
            {i > 0 && <ChevronRightIcon size={14} className="flex-none text-muted-faint" />}
            {item.href && !last ? (
              <Link href={item.href} className="flex-none text-iris-500">
                {item.label}
              </Link>
            ) : (
              <span className="truncate text-muted" aria-current={last ? "page" : undefined}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
