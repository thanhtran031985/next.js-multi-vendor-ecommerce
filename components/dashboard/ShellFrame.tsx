"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeftIcon, MenuIcon, XIcon } from "@/components/icons/dashboard";
import { drawerPanelClass, useDrawer } from "@/components/dashboard/use-drawer";

const SIDEBAR_ID = "dashboard-sidebar";

type ShellFrameProps = {
  rail: ReactNode;
  sidebar: ReactNode;
  /** Topbar content after the toggle button (breadcrumb, search, actions, user menu). */
  topbar: ReactNode;
  /** Max width of the content column: seller 1240px, admin 1280px (mockups). */
  contentWidth: "seller" | "admin";
  children: ReactNode;
};

/**
 * Interactive frame of the seller/admin dashboards: icon rail + sidebar + sticky topbar.
 * - md and up: the topbar button collapses/expands rail + sidebar (as in the mockups).
 * - below md: rail + sidebar become an off-canvas drawer opened by the same button.
 * The mockups have no mobile layout; the drawer is decisions.md "Responsive".
 */
export function ShellFrame({ rail, sidebar, topbar, contentWidth, children }: ShellFrameProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { open: drawerOpen, setOpen: setDrawerOpen, openerRef, closeRef } = useDrawer();

  function toggle() {
    if (window.matchMedia("(min-width: 48rem)").matches) setCollapsed((v) => !v);
    else setDrawerOpen((v) => !v);
  }

  return (
    <div className="flex min-h-screen bg-bg-dash">
      {drawerOpen && (
        <div aria-hidden="true" className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      <div
        id={SIDEBAR_ID}
        className={`fixed inset-y-0 left-0 z-50 flex md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 md:transition-none ${drawerPanelClass(
          drawerOpen,
        )} ${collapsed ? "md:hidden" : ""}`}
      >
        <div className="flex h-full w-16 flex-none flex-col items-center gap-2 bg-ink py-4">{rail}</div>
        <aside className="relative h-full w-59 flex-none overflow-y-auto border-r border-line bg-surface px-4 py-5">
          <button
            ref={closeRef}
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute top-5 right-3 flex size-8.5 items-center justify-center rounded-sm text-muted hover:bg-field md:hidden"
          >
            <XIcon size={16} />
          </button>
          {sidebar}
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-line bg-surface px-4 md:px-6.5">
          <button
            ref={openerRef}
            type="button"
            aria-label="Toggle sidebar"
            aria-controls={SIDEBAR_ID}
            onClick={toggle}
            className="flex size-7.5 flex-none items-center justify-center rounded-sm border border-line bg-surface text-muted transition-colors hover:bg-field focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none"
          >
            <span className="md:hidden">
              <MenuIcon size={15} />
            </span>
            <span className="hidden md:flex">{collapsed ? <MenuIcon size={15} /> : <ChevronLeftIcon size={15} />}</span>
          </button>
          {topbar}
        </header>

        <main
          className={`mx-auto flex w-full flex-col p-4 md:p-6.5 ${contentWidth === "seller" ? "max-w-marketing" : "max-w-dash"}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
