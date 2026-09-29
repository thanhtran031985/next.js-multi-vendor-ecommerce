"use client";

import { useEffect } from "react";
import { RotateCcwIcon, WarningIcon } from "@/components/icons/dashboard";
import { EmptyState } from "@/components/dashboard/EmptyState";

/**
 * Error state from the dashboard mockups (error-tone icon + "Try again"), rendered by the
 * dashboards' error.tsx. The message is generic: server error details never reach the client.
 */
export function DashboardError({
  error,
  retry,
  title,
  description,
  framed = true,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  title: string;
  description: string;
  framed?: boolean;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      variant="page"
      tone="error"
      framed={framed}
      icon={<WarningIcon size={36} strokeWidth={1.7} />}
      title={title}
      description={description}
      action={
        <button
          type="button"
          onClick={() => retry()}
          className="flex h-11.5 cursor-pointer items-center gap-2 rounded-control bg-iris-500 px-6 text-13-5 leading-none font-semibold text-white transition-colors hover:bg-iris-600 focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none"
        >
          <RotateCcwIcon size={16} />
          Try again
        </button>
      }
    />
  );
}
