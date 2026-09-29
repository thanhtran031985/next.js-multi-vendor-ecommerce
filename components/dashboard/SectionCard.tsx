import type { ReactNode } from "react";
import { comingSoonProps } from "@/components/dashboard/coming-soon";

export type ChipTone = "iris" | "info" | "success" | "warning" | "error";

export const chipToneClass: Record<ChipTone, string> = {
  iris: "bg-iris-50 text-iris-500",
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error-solid",
};

type SectionCardProps = {
  title: string;
  icon?: ReactNode;
  /**
   * Header style from the mockups:
   * - lg: 30px chip, 17px title (Business Analytics, Wallet, Earning Statistics)
   * - md: 28px chip, 16px title (vendor product lists)
   * - plain: bare 18px icon, 15px title (admin Users / Stores / Products cards);
   *   the caller colours the icon itself, `tone` is ignored
   */
  size?: "lg" | "md" | "plain";
  tone?: ChipTone;
  /** Right side of the header (range tabs, "View All", …). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** White dashboard card with an icon + title header. */
export function SectionCard({ title, icon, size = "lg", tone = "iris", action, className = "", children }: SectionCardProps) {
  const pad = size === "lg" ? "px-5 py-6 md:px-6.5" : "px-5 py-5.5 md:px-6";
  const headerGap = size === "lg" ? "mb-5" : size === "md" ? "mb-4.5" : "mb-4";
  return (
    <section className={`min-w-0 rounded-xl border border-line-soft bg-surface shadow-xs ${pad} ${className}`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 ${headerGap}`}>
        <h2 className={`m-0 flex items-center ${size === "plain" ? "gap-2.25" : "gap-2.5"}`}>
          {icon &&
            (size === "plain" ? (
              <span className="flex">{icon}</span>
            ) : (
              <span
                className={`flex items-center justify-center ${chipToneClass[tone]} ${
                  size === "lg" ? "size-7.5 rounded-md" : "size-7 rounded-sm"
                }`}
              >
                {icon}
              </span>
            ))}
          <span
            className={`font-display leading-none font-bold text-ink ${
              size === "lg" ? "text-17" : size === "md" ? "text-16" : "text-15"
            }`}
          >
            {title}
          </span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** "View All" header link for lists that have no page yet. */
export function ViewAllLink() {
  return (
    <span className="cursor-not-allowed text-12-5 leading-none font-semibold text-iris-500 opacity-50" {...comingSoonProps}>
      View All
    </span>
  );
}
