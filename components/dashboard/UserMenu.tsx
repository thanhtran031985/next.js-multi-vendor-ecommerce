"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDownIcon, UserIcon } from "@/components/icons";
import { comingSoonProps } from "@/components/dashboard/coming-soon";
import { SignOutItem } from "@/components/dashboard/SignOutItem";

export type UserMenuItem = { label: string; icon: ReactNode };

type UserMenuProps = {
  /** Pill: first line (name) and second line (masked email or role label). */
  pillTitle: string;
  pillSubtitle: string;
  /** Dropdown header. */
  name: string;
  email: string;
  /** Extra header line, e.g. the vendor's store name. */
  detail?: string;
  /** Menu entries without a page yet (rendered disabled, "Coming soon"). */
  items: UserMenuItem[];
  /** Dropdown width: seller 236px, admin 220px (mockups). */
  width: "seller" | "admin";
};

/**
 * Topbar profile pill + dropdown (seller/admin mockups), following the WAI-ARIA menu-button
 * pattern. Opens on click; from the keyboard (Enter/Space/↓, or ↑ for the last item) focus
 * moves into the menu. ↑/↓/Home/End move between items, Escape closes and returns focus to
 * the pill, Tab closes and moves on. Also closes on mouse leave (as in the mockup) or a click
 * outside. Disabled entries stay focusable (aria-disabled) so "Coming soon" is announced.
 * Logout uses the task-01 action.
 */
export function UserMenu({ pillTitle, pillSubtitle, name, email, detail, items, width }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  /** Item to focus once the menu has rendered open (keyboard opening only). */
  const [focusOnOpen, setFocusOnOpen] = useState<"first" | "last" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const menuItems = () => [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

  useEffect(() => {
    if (!open) return;
    if (focusOnOpen) {
      const list = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
      (focusOnOpen === "first" ? list[0] : list[list.length - 1])?.focus();
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, focusOnOpen]);

  function openWith(target: "first" | "last" | null) {
    setFocusOnOpen(target);
    setOpen(true);
  }

  function onButtonKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openWith(e.key === "ArrowDown" ? "first" : "last");
    }
  }

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const list = menuItems();
    const i = list.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    if (e.key === "ArrowDown") next = list[(i + 1) % list.length];
    else if (e.key === "ArrowUp") next = list[(i - 1 + list.length) % list.length];
    else if (e.key === "Home") next = list[0];
    else if (e.key === "End") next = list[list.length - 1];
    else if (e.key === "Tab") setOpen(false);
    if (next) {
      e.preventDefault();
      next.focus();
    }
  }

  return (
    <div ref={rootRef} className="relative ml-1.5" onMouseLeave={() => setOpen(false)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onKeyDown={onButtonKeyDown}
        // detail === 0: activated from the keyboard (Enter/Space), so focus the first item.
        onClick={(e) => (open ? setOpen(false) : openWith(e.detail === 0 ? "first" : null))}
        className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-surface pr-2 pl-1.5 transition-colors hover:bg-field focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none"
      >
        <Avatar size="pill" />
        <span className="hidden text-left sm:block">
          <span className="block font-display text-13 leading-none font-semibold text-ink">{pillTitle}</span>
          <span className="mt-1 block text-11 leading-none text-muted-soft">{pillSubtitle}</span>
        </span>
        <ChevronDownIcon size={15} className="text-muted" />
      </button>

      {/* pt-2.5 is the "padding bridge": the pointer can travel into the panel without it closing. */}
      <div
        id={menuId}
        className={`absolute top-full right-0 z-60 pt-2.5 transition-[opacity,transform] duration-160 ease-out ${
          width === "seller" ? "w-59" : "w-55"
        } ${open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1.5 opacity-0"}`}
      >
        <div className="rounded-lg border border-line-soft bg-surface p-1.5 shadow-menu">
          <div className="mb-1.5 flex items-center gap-2.75 border-b border-line-soft px-3.5 py-3">
            <Avatar size="menu" />
            <div className="min-w-0">
              <div className="truncate font-display text-13-5 leading-none font-bold text-ink">{name}</div>
              <div className="mt-1.25 truncate text-11 leading-none text-muted-soft">{email}</div>
              {detail && <div className="mt-1.25 truncate text-11 leading-none font-semibold text-iris-500">{detail}</div>}
            </div>
          </div>
          <div ref={menuRef} role="menu" aria-label="Account" onKeyDown={onMenuKeyDown}>
            {items.map((item) => (
              <span
                key={item.label}
                role="menuitem"
                tabIndex={-1}
                className={`flex cursor-not-allowed items-center gap-2.75 rounded-md px-3.5 py-2.5 text-13-5 leading-none font-medium text-ink-soft opacity-50 ${focusRing}`}
                {...comingSoonProps}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
            <div role="none" className="mt-0.5 border-t border-line-soft pt-0.5">
              <SignOutItem
                role="menuitem"
                tabIndex={-1}
                label="Logout"
                iconSize={17}
                className={`flex w-full cursor-pointer items-center gap-2.75 rounded-md px-3.5 pt-3 pb-2.5 text-left text-13-5 leading-none font-semibold text-error-solid transition-colors hover:bg-error-bg disabled:cursor-not-allowed ${focusRing}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const focusRing = "focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none";

function Avatar({ size }: { size: "pill" | "menu" }) {
  return (
    <span
      className={`flex flex-none items-center justify-center bg-linear-135 from-iris-100 to-iris-50 text-iris-500 ${
        size === "pill" ? "size-8.5 rounded-full" : "size-9.5 rounded-md"
      }`}
    >
      <UserIcon size={size === "pill" ? 18 : 19} />
    </span>
  );
}
