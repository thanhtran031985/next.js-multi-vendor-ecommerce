import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/guards";

/**
 * Admin area. /admin/login sits outside this (protected) group so it stays reachable.
 * proxy.ts already checked the role; this re-checks on the server.
 */
export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  await requireRole("ADMIN");
  return children;
}
