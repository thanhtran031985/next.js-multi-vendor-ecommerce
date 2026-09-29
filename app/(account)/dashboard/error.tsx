"use client";

import { DashboardError } from "@/components/dashboard/DashboardError";

export default function CustomerDashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <DashboardError
      error={error}
      retry={retry}
      framed={false}
      title="Couldn't load your profile"
      description="Something went wrong while fetching your account details. Please try again."
    />
  );
}
