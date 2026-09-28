// Server-side auth checks for pages and layouts (Node runtime). Defence in depth behind
// proxy.ts: the proxy only sees the JWT, these re-check on the server and read vendor status
// from the DB.
//
// Layouts are not re-rendered on client-side navigation between their child pages, so a
// layout check alone does not run on every route change: protected pages call these too.
// `cache` makes the layout + page calls share one lookup per request.

import { redirect } from "next/navigation";
import { cache } from "react";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getRoleHome, loginPathForRole, type Role } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export type SessionUser = Session["user"];

const areaRoot: Record<Role, string> = {
  CUSTOMER: "/dashboard",
  VENDOR: "/vendor/dashboard",
  ADMIN: "/admin/dashboard",
};

/** Auth pages (login/register): a signed-in user is sent to their own area instead. */
export async function redirectIfSignedIn(): Promise<void> {
  const session = await auth();
  if (session?.user?.role) redirect(getRoleHome(session.user));
}

/**
 * Signed-in user with `role`, otherwise redirect: signed out -> that role's login page,
 * wrong role -> the user's own home.
 */
export const requireRole = cache(async (role: Role): Promise<SessionUser> => {
  const session = await auth();
  const user = session?.user;
  if (!user?.role) {
    redirect(`${loginPathForRole(role)}?callbackUrl=${encodeURIComponent(areaRoot[role])}`);
  }
  if (user.role !== role) redirect(getRoleHome(user));
  return user;
});

/**
 * Vendor whose store is APPROVED right now, per the DB (the token copy may be stale).
 * PENDING, SUSPENDED or missing store -> /vendor/pending.
 */
export const requireApprovedVendor = cache(async () => {
  const user = await requireRole("VENDOR");
  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
    select: { id: true, storeName: true, slug: true, status: true },
  });
  if (!vendor || vendor.status !== "APPROVED") redirect("/vendor/pending");
  return { user, vendor };
});

/** Reads `callbackUrl` from page searchParams (first value if repeated). Sanitised later, server-side. */
export function readCallbackUrl(params: Record<string, string | string[] | undefined>): string | undefined {
  const raw = params.callbackUrl;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value || undefined;
}
