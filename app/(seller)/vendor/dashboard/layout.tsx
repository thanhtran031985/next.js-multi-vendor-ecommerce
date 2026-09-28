import type { ReactNode } from "react";
import { requireApprovedVendor } from "@/lib/auth/guards";

/**
 * Seller area. Role is checked by proxy.ts; vendor status is re-read from the DB on every
 * request here (not trusted from the JWT). Anything but APPROVED -> /vendor/pending.
 */
export default async function VendorDashboardLayout({ children }: { children: ReactNode }) {
  await requireApprovedVendor();
  return children;
}
