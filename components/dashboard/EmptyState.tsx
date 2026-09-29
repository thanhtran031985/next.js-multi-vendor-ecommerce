import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  /** Optional button/link under the text. */
  action?: ReactNode;
  /**
   * - page: full-width card from the mockups' Empty/Error states (78px icon, dashed border)
   * - inline: inside a widget card, for data that has no source yet
   */
  variant?: "page" | "inline";
  tone?: "default" | "error";
  /** page variant: false = no card frame (state shown inside an existing card). */
  framed?: boolean;
  className?: string;
};

/** Icon + message (+ action) shown instead of data. Never shows placeholder figures. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "inline",
  tone = "default",
  framed = true,
  className = "",
}: EmptyStateProps) {
  const iconTone = tone === "error" ? "bg-error-bg text-error-solid" : "bg-iris-50 text-iris-400";

  if (variant === "page") {
    const frame = !framed
      ? "py-16"
      : `rounded-xl bg-surface py-18 ${tone === "error" ? "border border-error-line" : "border border-dashed border-line-dashed"}`;
    return (
      <div className={`flex flex-col items-center px-8 text-center ${frame} ${className}`}>
        <div className={`mb-5.5 flex size-19.5 items-center justify-center rounded-2xl ${iconTone}`}>{icon}</div>
        <div className="font-display text-20 leading-120 font-bold text-ink">{title}</div>
        {description && <p className="mx-0 mt-3 mb-0 max-w-90 text-14 leading-150 text-muted">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center px-4 py-8 text-center ${className}`}>
      <div className={`mb-3.5 flex size-12 items-center justify-center rounded-lg ${iconTone}`}>{icon}</div>
      <div className="font-display text-14 leading-120 font-bold text-ink">{title}</div>
      {description && <p className="mx-0 mt-1.5 mb-0 max-w-70 text-12-5 leading-150 text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
