import type { InputHTMLAttributes } from "react";

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "size"> & {
  /** Accessible name (the switch has no visible text of its own). */
  label: string;
};

/**
 * On/off switch (DESIGN_SYSTEM Toggle/Switch: 38×22 track, iris when on, --toggle-off when
 * off). A real checkbox with role="switch" underneath, so it works both controlled
 * (checked + onChange) and inside a form (name + defaultChecked, submits "on" or its value).
 */
export function Switch({ label, className = "", ...input }: SwitchProps) {
  return (
    <span className={`relative inline-flex flex-none ${className}`}>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...input}
      />
      <span
        aria-hidden="true"
        className="flex h-5.5 w-9.5 items-center rounded-full bg-toggle-off p-0.5 transition-colors duration-150 peer-checked:bg-iris-500 peer-focus-visible:ring-3 peer-focus-visible:ring-iris-100 peer-disabled:opacity-60 peer-checked:[&>span]:translate-x-4"
      >
        <span className="size-4.5 rounded-full bg-white shadow-xs transition-transform duration-150" />
      </span>
    </span>
  );
}
