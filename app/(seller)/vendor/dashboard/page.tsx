import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireApprovedVendor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Seller dashboard" };

// Placeholder until the seller dashboard is built.
export default async function VendorDashboardPage() {
  await requireApprovedVendor(); // layouts don't re-run on client navigation; check here too
  return (
    <div className="flex flex-col items-start gap-6">
      <h1 className="m-0 font-display text-28 leading-none font-extrabold tracking-heading text-ink">Seller dashboard</h1>
      <SignOutButton />
    </div>
  );
}
