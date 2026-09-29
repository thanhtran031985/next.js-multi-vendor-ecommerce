import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AlertIcon, BanIcon, CheckIcon, ClockIcon } from "@/components/icons";
import { StatusBadge } from "@/components/StatusBadge";
import { ApprovedRedirect } from "@/components/vendor/ApprovedRedirect";
import { Wordmark } from "@/components/Wordmark";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Store status" };

/**
 * Where PENDING and SUSPENDED vendors land. Vendor status is read from the DB on every
 * request (the JWT copy may be stale). If the store is APPROVED, the session is refreshed and
 * the vendor is sent to the dashboard.
 */
export default async function VendorPendingPage() {
  const user = await requireRole("VENDOR");

  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
    select: { storeName: true, status: true },
  });

  if (!vendor) {
    return (
      <StatusShell
        tone="error"
        icon={<AlertIcon size={26} />}
        title="We couldn't find your store"
        badge={null}
      >
        Your account is registered as a seller, but no store is linked to it. Contact Covet seller support so we can
        fix this for you.
      </StatusShell>
    );
  }

  if (vendor.status === "APPROVED") {
    return (
      <StatusShell
        tone="success"
        icon={<CheckIcon size={26} />}
        title={vendor.storeName}
        badge={<StatusBadge status="Approved" />}
        showActions={false}
      >
        <ApprovedRedirect />
      </StatusShell>
    );
  }

  if (vendor.status === "SUSPENDED") {
    return (
      <StatusShell
        tone="error"
        icon={<BanIcon size={26} />}
        title="Your store is suspended"
        badge={<StatusBadge status="Suspended" />}
        storeName={vendor.storeName}
      >
        The seller dashboard is unavailable while your store is suspended. Contact Covet seller support to find out
        why and what you need to do to restore it.
      </StatusShell>
    );
  }

  return (
    <StatusShell
      tone="warning"
      icon={<ClockIcon size={26} />}
      title="Your store is under review"
      badge={<StatusBadge status="Pending" label="Pending review" />}
      storeName={vendor.storeName}
      showRefresh
    >
      Thanks for registering with Covet. Our team reviews every new store before it goes live. You can open your
      seller dashboard as soon as your store is approved.
    </StatusShell>
  );
}

const toneClass = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
} as const;

function StatusShell({
  tone,
  icon,
  title,
  badge,
  storeName,
  showRefresh = false,
  showActions = true,
  children,
}: {
  tone: keyof typeof toneClass;
  icon: ReactNode;
  title: string;
  badge: ReactNode;
  storeName?: string;
  showRefresh?: boolean;
  /** Refresh + sign-out row; hidden while redirecting an approved vendor. */
  showActions?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-dash px-(--cpad) py-14">
      <Link href="/" aria-label="Covet home" className="mb-8 text-ink hover:text-ink">
        <Wordmark className="text-26" />
      </Link>
      <div className="w-full max-w-130 rounded-2xl border border-line-soft bg-surface px-6 py-10 text-center shadow-xs sm:px-11.5">
        <span className={`mx-auto mb-5 flex size-14 items-center justify-center rounded-xl ${toneClass[tone]}`}>{icon}</span>
        {badge && <div className="mb-3.5">{badge}</div>}
        <h1 className="m-0 font-display text-24 leading-120 font-extrabold tracking-heading text-ink">{title}</h1>
        {storeName && (
          <p className="mt-2 mb-0 text-13 leading-150 font-semibold text-iris-500">{storeName}</p>
        )}
        <div className="mt-4 text-14 leading-160 text-muted">{children}</div>
        {showActions && (
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {showRefresh && (
              // Full reload so the status is re-read from the DB.
              <a
                href="/vendor/pending"
                className="inline-flex h-11 items-center rounded-control bg-iris-500 px-5 font-display text-13 leading-none font-bold text-white transition-colors hover:bg-iris-600 hover:text-white"
              >
                Check status again
              </a>
            )}
            <SignOutButton />
          </div>
        )}
      </div>
    </main>
  );
}
