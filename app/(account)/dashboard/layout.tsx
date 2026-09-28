import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";

/** Customer area. proxy.ts already checked the role; this re-checks on the server. */
export default async function CustomerDashboardLayout({ children }: { children: ReactNode }) {
  await requireRole("CUSTOMER");
  return children;
}
