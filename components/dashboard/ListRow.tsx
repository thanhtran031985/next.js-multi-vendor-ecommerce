import type { ReactNode } from "react";

/**
 * Bordered list row from the mockups (Top Customers, Most Rated Products): leading visual,
 * title + subtitle, optional trailing badge.
 */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
}: {
  leading: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-line-soft p-3 hover:bg-bg-subtle">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-14 leading-120 font-semibold text-ink">{title}</div>
        {subtitle && <div className="mt-1.5 truncate text-11-5 leading-none text-muted-soft">{subtitle}</div>}
      </div>
      {trailing}
    </div>
  );
}
