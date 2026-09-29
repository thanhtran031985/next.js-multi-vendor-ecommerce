"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronRightIcon, MenuIcon, XIcon } from "@/components/icons/dashboard";

const SIDEBAR_ID = "account-sidebar";

/**
 * Breadcrumb + two-column body of the customer dashboard (userdashboard mockup):
 * 300px account sidebar + white content card. The mockup has no mobile layout: below md
 * the sidebar becomes an off-canvas drawer opened by the "Account menu" button.
 */
export function AccountFrame({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <>
      <div className="mx-auto flex max-w-page items-center gap-2 px-(--cpad) pt-5.5 text-13 leading-none text-muted-soft">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2">
          <Link href="/" className="text-muted">
            Home
          </Link>
          <ChevronRightIcon size={14} className="text-muted-faint" />
          <span className="font-semibold text-ink" aria-current="page">
            My Dashboard
          </span>
        </nav>
        <button
          type="button"
          aria-controls={SIDEBAR_ID}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          className="ml-auto flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-3 text-13 leading-none font-semibold text-ink-soft md:hidden"
        >
          <MenuIcon size={16} />
          Account menu
        </button>
      </div>

      {drawerOpen && (
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      <div className="mx-auto grid max-w-page items-start gap-6 px-(--cpad) pt-5 md:grid-cols-[18.75rem_1fr]">
        <aside
          id={SIDEBAR_ID}
          aria-label="Account"
          className={`fixed inset-y-0 left-0 z-50 w-75 max-w-[85vw] overflow-y-auto border border-line-soft bg-surface p-3.5 shadow-xs transition-transform duration-200 md:sticky md:top-24 md:z-auto md:w-auto md:max-w-none md:translate-x-0 md:overflow-visible md:rounded-xl md:transition-none ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute top-3 right-3 flex size-8.5 items-center justify-center rounded-sm text-muted hover:bg-field md:hidden"
          >
            <XIcon size={16} />
          </button>
          {sidebar}
        </aside>

        <div className="min-h-160 min-w-0 rounded-xl border border-line-soft bg-surface px-5 pt-8 pb-10 shadow-xs md:px-9">
          {children}
        </div>
      </div>
    </>
  );
}
