import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { vendorNav } from "@/lib/dashboard/nav";

/**
 * Seller area. Role is checked by proxy.ts; vendor status is re-read from the DB on every
 * request here (not trusted from the JWT). Anything but APPROVED -> /vendor/pending.
 */
export default async function VendorDashboardLayout({ children }: { children: ReactNode }) {
  const { user, vendor } = await requireApprovedVendor();
  return (
    <DashboardShell
      variant="seller"
      nav={vendorNav}
      user={{ name: user.name ?? "", email: user.email ?? "" }}
      storeName={vendor.storeName}
    >
      {children}
    </DashboardShell>
  );
}
