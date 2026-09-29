"use client";

import { DashboardError } from "@/components/dashboard/DashboardError";

/**
 * Error state of /admin/brands (AdminProductList mockup "Error"). Uses Next 16.3's `retry`
 * (re-fetches the server data), not `reset` (re-renders only) — decisions.md.
 */
export default function BrandsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <DashboardError
      error={error}
      retry={retry}
      title="Couldn't load brands"
      description="Something went wrong. Please try again."
    />
  );
}
