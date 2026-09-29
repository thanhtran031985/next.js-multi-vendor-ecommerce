"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
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
 * Topbar profile pill + dropdown (seller/admin mockups). Opens on click, closes on mouse
 * leave (as in the mockup), Escape or a click outside. Logout uses the task-01 action.
 */
export function UserMenu({ pillTitle, pillSubtitle, name, email, detail, items, width }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
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
  }, [open]);

  return (
    <div ref={rootRef} className="relative ml-1.5" onMouseLeave={() => setOpen(false)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
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
        <div role="menu" aria-label="Account" className="rounded-lg border border-line-soft bg-surface p-1.5 shadow-menu">
          <div className="mb-1.5 flex items-center gap-2.75 border-b border-line-soft px-3.5 py-3">
            <Avatar size="menu" />
            <div className="min-w-0">
              <div className="truncate font-display text-13-5 leading-none font-bold text-ink">{name}</div>
              <div className="mt-1.25 truncate text-11 leading-none text-muted-soft">{email}</div>
              {detail && <div className="mt-1.25 truncate text-11 leading-none font-semibold text-iris-500">{detail}</div>}
            </div>
          </div>
          {items.map((item) => (
            <span
              key={item.label}
              role="menuitem"
              className="flex cursor-not-allowed items-center gap-2.75 rounded-md px-3.5 py-2.5 text-13-5 leading-none font-medium text-ink-soft opacity-50"
              {...comingSoonProps}
            >
              {item.icon}
              {item.label}
            </span>
          ))}
          <div className="mt-0.5 border-t border-line-soft pt-0.5">
            <SignOutItem
              role="menuitem"
              label="Logout"
              iconSize={17}
              className="flex w-full cursor-pointer items-center gap-2.75 rounded-md px-3.5 pt-3 pb-2.5 text-left text-13-5 leading-none font-semibold text-error-solid transition-colors hover:bg-error-bg focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
