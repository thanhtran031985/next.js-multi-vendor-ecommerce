// Status string -> status token pair (DESIGN_SYSTEM §2, CLAUDE.md StatusBadge rules).

type Tone = "success" | "warning" | "error" | "info" | "accent";

const toneByStatus: Record<string, Tone> = {
  paid: "success",
  delivered: "success",
  approved: "success",
  active: "success",
  "in-stock": "success",
  pending: "warning",
  packaging: "warning",
  "out-for-delivery": "warning",
  "soon-stock-out": "warning",
  canceled: "error",
  failed: "error",
  rejected: "error",
  unpaid: "error",
  "out-of-stock": "error",
  suspended: "error",
  confirmed: "info",
  shipped: "info",
  open: "info",
  returned: "info",
};

const toneClass: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
  accent: "bg-accent-bg text-accent-fg",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const key = status.trim().toLowerCase().replace(/[\s_]+/g, "-");
  const tone = toneByStatus[key] ?? "accent";
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.75 py-1.25 text-11 leading-none font-semibold ${toneClass[tone]}`}
    >
      {text}
    </span>
  );
}
