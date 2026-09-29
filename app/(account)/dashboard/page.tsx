import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireRole } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "My account" };

// Placeholder until the customer dashboard is built.
export default async function CustomerDashboardPage() {
  await requireRole("CUSTOMER"); // layouts don't re-run on client navigation; check here too
  return (
    <div className="flex flex-col items-start gap-6">
      <h1 className="m-0 font-display text-28 leading-none font-extrabold tracking-heading text-ink">My account</h1>
      <SignOutButton />
    </div>
  );
}
