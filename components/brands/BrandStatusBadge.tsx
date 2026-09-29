import type { BrandStatusValue } from "@/lib/brands/schema";

/**
 * ACTIVE = success tokens, INACTIVE = muted (decisions.md: the shared StatusBadge has no
 * muted tone and would show "inactive" in accent purple). Same shape as StatusBadge.
 */
export function BrandStatusBadge({ status }: { status: BrandStatusValue }) {
  const tone = status === "ACTIVE" ? "bg-success-bg text-success" : "bg-track text-muted";
  return (
    <span className={`inline-flex items-center rounded-full px-2.75 py-1.25 text-11 leading-none font-semibold ${tone}`}>
      {status === "ACTIVE" ? "Active" : "Inactive"}
    </span>
  );
}
