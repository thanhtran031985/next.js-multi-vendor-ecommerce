import type { ReactNode } from "react";
import { AlertIcon, ClockIcon, TruckIcon } from "@/components/icons";
import { BoxIcon, CheckCircleIcon, CheckMarkIcon, RotateCcwIcon, XCircleIcon } from "@/components/icons/dashboard";
import type { ChipTone } from "@/components/dashboard/SectionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { ORDER_STATUSES, type OrderStatusCounts, type OrderStatusKey } from "@/lib/dashboard/types";

type StatusDef = { label: string; tone: ChipTone; valueTone: "ink" | "success" | "error"; icon: (size: number) => ReactNode };

const sw = 1.9;
const defs: Record<OrderStatusKey, StatusDef> = {
  pending: { label: "Pending", tone: "info", valueTone: "ink", icon: (s) => <ClockIcon size={s} strokeWidth={sw} /> },
  confirmed: { label: "Confirmed", tone: "success", valueTone: "success", icon: (s) => <CheckCircleIcon size={s} strokeWidth={sw} /> },
  packaging: { label: "Packaging", tone: "warning", valueTone: "ink", icon: (s) => <BoxIcon size={s} strokeWidth={sw} /> },
  outForDelivery: { label: "Out For Delivery", tone: "iris", valueTone: "ink", icon: (s) => <TruckIcon size={s} strokeWidth={sw} /> },
  delivered: { label: "Delivered", tone: "success", valueTone: "success", icon: (s) => <CheckMarkIcon size={s} strokeWidth={sw} /> },
  canceled: { label: "Canceled", tone: "error", valueTone: "ink", icon: (s) => <XCircleIcon size={s} strokeWidth={sw} /> },
  returned: { label: "Returned", tone: "info", valueTone: "ink", icon: (s) => <RotateCcwIcon size={s} strokeWidth={sw} /> },
  failed: { label: "Failed To Deliver", tone: "error", valueTone: "error", icon: (s) => <AlertIcon size={s} strokeWidth={sw} /> },
};

/**
 * The 8 order-status tiles of "Business Analytics". Counts are null until the Order model
 * exists: every tile then shows a dash (no invented numbers).
 * - seller: large tiles (vendordashboard) · admin: compact white tiles (AdminDashboard)
 */
export function OrderStatusGrid({ counts, variant }: { counts: OrderStatusCounts; variant: "seller" | "admin" }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {ORDER_STATUSES.map((key) => {
        const def = defs[key];
        return (
          <StatCard
            key={key}
            variant={variant === "seller" ? "status" : "status-compact"}
            label={variant === "admin" && key === "failed" ? "Failed To Delivery" : def.label}
            value={counts ? counts[key] : null}
            tone={def.tone}
            valueTone={def.valueTone}
            icon={def.icon(18)}
          />
        );
      })}
    </div>
  );
}
