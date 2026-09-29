"use client";

import { DashboardError } from "@/components/dashboard/DashboardError";

export default function VendorDashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <DashboardError
      error={error}
      retry={retry}
      title="Couldn't load your dashboard"
      description="Something went wrong while loading your analytics. Please try again."
    />
  );
}
