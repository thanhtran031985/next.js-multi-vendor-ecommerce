import type { ReactNode } from "react";
import { AccountShell } from "@/components/dashboard/AccountShell";
import { requireRole } from "@/lib/auth/guards";
import { customerNav } from "@/lib/dashboard/nav";

/** Customer area. proxy.ts already checked the role; this re-checks on the server. */
export default async function CustomerDashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("CUSTOMER");
  return (
    <AccountShell user={{ name: user.name ?? "", email: user.email ?? "" }} nav={customerNav}>
      {children}
    </AccountShell>
  );
}
