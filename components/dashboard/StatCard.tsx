import type { ReactNode } from "react";
import { chipToneClass, type ChipTone } from "@/components/dashboard/SectionCard";

type StatCardProps = {
  label: string;
  /** null = no data source yet: renders a dash, never a made-up figure. */
  value: number | string | null;
  icon: ReactNode;
  tone: ChipTone;
  /**
   * - metric: label + large value, chip on the right (admin Total Stores / Customers …)
   * - status: chip, label, value on the right (vendor order-status tiles)
   * - status-compact: smaller white tile (admin order-status grid)
   */
  variant: "metric" | "status" | "status-compact";
  /** Colour of the number in status tiles (mockup: green for Confirmed/Delivered, red for Failed). */
  valueTone?: "ink" | "success" | "error";
};

const valueToneClass = { ink: "text-ink", success: "text-success-solid", error: "text-error-solid" } as const;

export function StatCard({ label, value, icon, tone, variant, valueTone = "ink" }: StatCardProps) {
  const shown =
    value === null ? (
      <>
        <span aria-hidden="true">—</span>
        <span className="sr-only">No data yet</span>
      </>
    ) : typeof value === "number" ? (
      value.toLocaleString("en-US")
    ) : (
      value
    );
  const valueColor = value === null ? "text-muted-soft" : valueToneClass[valueTone];

  if (variant === "metric") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-bg-subtle p-4.5">
        <div>
          <div className="text-12-5 leading-120 font-medium text-muted">{label}</div>
          <div className={`mt-3 font-display text-26 leading-none font-extrabold ${valueColor}`}>{shown}</div>
        </div>
        <span className={`flex size-11 flex-none items-center justify-center rounded-control ${chipToneClass[tone]}`}>
          {icon}
        </span>
      </div>
    );
  }

  if (variant === "status") {
    return (
      <div className="flex items-center gap-3.25 rounded-lg border border-line-soft bg-bg-subtle p-4 transition-shadow duration-200 hover:shadow-card-hover">
        <span className={`flex size-10 flex-none items-center justify-center rounded-md ${chipToneClass[tone]}`}>{icon}</span>
        <div className="flex-1 text-12-5 leading-120 text-muted">{label}</div>
        <span className={`font-display text-20 leading-none font-extrabold ${valueColor}`}>{shown}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.75 rounded-control border border-line-soft bg-surface px-4 py-3.5">
      <span className={`flex size-8.5 flex-none items-center justify-center rounded-md ${chipToneClass[tone]}`}>{icon}</span>
      <span className="flex-1 text-12-5 leading-120 font-medium text-ink-soft">{label}</span>
      <span className={`font-display text-16 leading-none font-bold ${valueColor}`}>{shown}</span>
    </div>
  );
}
