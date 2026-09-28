import type { Metadata } from "next";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireRole } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Admin dashboard" };

// Placeholder until the admin dashboard is built.
export default async function AdminDashboardPage() {
  await requireRole("ADMIN"); // layouts don't re-run on client navigation; check here too
  return (
    <main className="mx-auto flex w-full max-w-page flex-col items-start gap-6 px-(--cpad) py-14">
      <h1 className="m-0 font-display text-28 leading-none font-extrabold tracking-heading text-ink">Admin dashboard</h1>
      <SignOutButton />
    </main>
  );
}
