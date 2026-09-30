"use client";

import { DashboardError } from "@/components/dashboard/DashboardError";

/** Error state of /admin/brands/[id]; same `retry` as the list (re-fetches the server data). */
export default function BrandDetailError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <DashboardError
      error={error}
      retry={retry}
      title="Couldn't load this brand"
      description="Something went wrong. Please try again."
    />
  );
}
