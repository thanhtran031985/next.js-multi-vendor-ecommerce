import type { SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "@/components/icons";

/**
 * Native select styled like the VendorAddProduct mockup's selects (46px, --bg-subtle field,
 * iris focus ring). Native so keyboard and screen-reader behaviour come for free.
 */
export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <select
        className="h-11.5 w-full cursor-pointer appearance-none rounded-md border border-line bg-bg-subtle pr-9.5 pl-3.5 text-13-5 leading-none text-ink transition-colors outline-none focus:border-iris-500 focus:bg-surface focus:ring-3 focus:ring-iris-100 disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        size={14}
        className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
      />
    </span>
  );
}
