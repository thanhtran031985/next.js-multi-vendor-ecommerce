"use client";

import { DashboardError } from "@/components/dashboard/DashboardError";

export default function AdminDashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <DashboardError
      error={error}
      retry={retry}
      title="Couldn't load dashboard"
      description="Something went wrong while loading platform analytics. Please try again."
    />
  );
}
