"use client";

import { startTransition, useOptimistic } from "react";
import toast from "react-hot-toast";
import { toggleBrandStatusAction } from "@/app/actions/brands";
import { BrandStatusBadge } from "@/components/brands/BrandStatusBadge";
import { Switch } from "@/components/ui/Switch";
import { UNEXPECTED_ERROR } from "@/lib/actions/result";
import type { BrandStatusValue } from "@/lib/brands/schema";

/**
 * Switch + badge on a list row. Flips at once (useOptimistic); the server value comes back
 * with the revalidated page. On failure the optimistic value is dropped, so the switch
 * returns to the saved status, and a toast explains why.
 */
export function BrandStatusToggle({ id, name, status }: { id: string; name: string; status: BrandStatusValue }) {
  const [shown, setShown] = useOptimistic(status);

  function change(checked: boolean) {
    const next: BrandStatusValue = checked ? "ACTIVE" : "INACTIVE";
    startTransition(async () => {
      setShown(next);
      try {
        const result = await toggleBrandStatusAction(id, next);
        if (!result.success) toast.error(result.error);
      } catch {
        // Network failure or server crash: the action itself never throws.
        toast.error(UNEXPECTED_ERROR);
      }
    });
  }

  return (
    <span className="flex items-center gap-2.5">
      <Switch
        label={`${name} active`}
        checked={shown === "ACTIVE"}
        onChange={(e) => change(e.currentTarget.checked)}
      />
      <BrandStatusBadge status={shown} />
    </span>
  );
}
