import { comingSoonProps } from "@/components/dashboard/coming-soon";

const ranges = ["This Year", "This Month", "This Week"];

/**
 * "This Year / This Month / This Week" segmented control above the charts. There is no data
 * to filter yet, so it shows the default range and is disabled ("Coming soon").
 */
export function RangeTabs() {
  return (
    <div className="flex gap-1 rounded-md bg-line-soft p-1" role="group" aria-label="Date range" {...comingSoonProps}>
      {ranges.map((label, i) => (
        <span
          key={label}
          className={`flex h-8 cursor-not-allowed items-center rounded-sm px-3.5 text-12 leading-none ${
            i === 0 ? "bg-iris-500 font-semibold text-white" : "font-medium text-muted"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
