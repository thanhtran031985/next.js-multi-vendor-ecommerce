import { TrendIcon } from "@/components/icons/dashboard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export type LegendItem = { label: string; dot: "iris" | "success" | "warning" | "info" | "iris-deep" };

const dotClass: Record<LegendItem["dot"], string> = {
  iris: "bg-iris-500",
  success: "bg-success-solid",
  warning: "bg-warning-solid",
  info: "bg-info-solid",
  "iris-deep": "bg-iris-900",
};

/**
 * Chart area from the mockups (legend + fixed-height canvas). No chart library is installed
 * and there is no data yet, so the canvas keeps its size and shows an empty state.
 * decisions.md: the library is chosen by the task that brings real data.
 */
export function ChartFrame({
  legend,
  height = "md",
  emptyTitle = "No data yet",
  emptyDescription,
}: {
  legend?: LegendItem[];
  /** md = 300px (line charts), sm = 230px (User Overview donut). */
  height?: "md" | "sm";
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <>
      {legend && legend.length > 0 && (
        <ul className="mx-0 mt-3.5 mb-3 flex list-none flex-wrap items-center justify-center gap-6 p-0">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-12-5 leading-none font-medium text-ink-soft">
              <span className={`size-2.75 rounded-full ${dotClass[item.dot]}`} />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-line-dashed ${
          height === "md" ? "h-75" : "h-57.5"
        }`}
      >
        <EmptyState icon={<TrendIcon size={22} />} title={emptyTitle} description={emptyDescription} />
      </div>
    </>
  );
}
