"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { XIcon } from "@/components/icons/dashboard";

type DialogProps = {
  title: string;
  description?: string;
  /** Called on Esc, the close button or a click on the backdrop (unless `dismissible` is false). */
  onClose: () => void;
  /** False while a request is in flight: Esc/backdrop/close do nothing. */
  dismissible?: boolean;
  size?: "md" | "sm";
  children: ReactNode;
};

/**
 * Modal dialog on the native <dialog> + showModal(): focus is trapped inside, the rest of the
 * page is inert, Esc closes. Render it only while open (mount = open, unmount = closed), so
 * every opening starts fresh. Focus goes back to the element that opened it.
 * DESIGN_SYSTEM Dialog: surface, --shadow-xl, --r-2xl, --backdrop + 3px blur.
 */
export function Dialog({ title, description, onClose, dismissible = true, size = "md", children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    // showModal() focuses the first focusable element (the close button); prefer the field
    // marked data-autofocus (React's autoFocus runs before the dialog is open).
    dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {
      if (dialog.open) dialog.close();
      opener?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Esc: keep the dialog under React's control (the parent unmounts it).
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      // A click on the <dialog> element itself (not its content) is a click on the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-surface p-0 text-ink-soft shadow-xl backdrop:bg-backdrop backdrop:backdrop-blur-[0.1875rem] ${
        size === "md" ? "max-w-130" : "max-w-105"
      }`}
    >
      <div className="relative px-7 pt-6.5 pb-7">
        <button
          type="button"
          aria-label="Close"
          onClick={() => dismissible && onClose()}
          disabled={!dismissible}
          className="absolute top-5 right-5 flex size-8.5 cursor-pointer items-center justify-center rounded-sm text-muted transition-colors hover:bg-field hover:text-ink focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XIcon size={16} />
        </button>
        <h2 id={titleId} className="m-0 pr-10 font-display text-18 leading-120 font-bold text-ink">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="mx-0 mt-2 mb-0 pr-10 text-13 leading-150 text-muted">
            {description}
          </p>
        )}
        <div className="mt-5.5">{children}</div>
      </div>
    </dialog>
  );
}
