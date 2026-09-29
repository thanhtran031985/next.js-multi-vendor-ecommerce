import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireRole } from "@/lib/auth/guards";
import { adminNav } from "@/lib/dashboard/nav";

/**
 * Admin area. /admin/login sits outside this (protected) group so it stays reachable.
 * proxy.ts already checked the role; this re-checks on the server.
 * `breadcrumb` is the @breadcrumb parallel-route slot: each page's trail, rendered on the
 * server (no flash). Pages without their own slot page get the default via [...catchAll].
 */
export default async function AdminProtectedLayout({
  children,
  breadcrumb,
}: {
  children: ReactNode;
  breadcrumb: ReactNode;
}) {
  const user = await requireRole("ADMIN");
  return (
    <DashboardShell
      variant="admin"
      nav={adminNav}
      user={{ name: user.name ?? "", email: user.email ?? "" }}
      breadcrumb={breadcrumb}
    >
      {children}
    </DashboardShell>
  );
}
