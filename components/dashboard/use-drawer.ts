"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Off-canvas drawer state shared by the dashboard shells (mobile sidebar).
 * - closes on navigation and on Escape
 * - moves focus to the drawer's close button when it opens, and back to the button that
 *   opened it when it closes (the drawer itself is `invisible` while closed, so its links
 *   are out of the tab order and hidden from screen readers)
 */
export function useDrawer() {
  const [open, setOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Close after navigating (reset during render, no effect needed).
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) {
        wasOpen.current = false;
        openerRef.current?.focus();
      }
      return;
    }
    wasOpen.current = true;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return { open, setOpen, openerRef, closeRef };
}

/**
 * Classes for the drawer panel below md: slides in/out, and is `invisible` when closed so
 * nothing inside can be focused. The transition that applies is the target state's:
 * opening turns visibility on at once (so focus can move in), closing delays it to the end
 * of the slide-out.
 */
export function drawerPanelClass(open: boolean): string {
  return open
    ? "translate-x-0 transition-transform duration-200"
    : "-translate-x-full transition-[transform,visibility] duration-200 max-md:invisible";
}
