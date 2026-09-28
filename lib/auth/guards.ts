// Server-side auth checks for pages and layouts (Node runtime). Defence in depth behind
// proxy.ts: the proxy only sees the JWT, these re-check the user against the DB on every
// request (role, existence, vendor status), so a deleted or re-roled account loses access
// immediately instead of when its token expires.
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

/**
 * Clears a session whose token no longer matches the DB. A route handler, because cookies
 * cannot be cleared while rendering a page, and redirecting to a login page instead would
 * loop: the proxy still sees the old token and sends the user back.
 */
export const SESSION_ENDED_PATH = "/auth/session-ended";

const areaRoot: Record<Role, string> = {
  CUSTOMER: "/dashboard",
  VENDOR: "/vendor/dashboard",
  ADMIN: "/admin/dashboard",
};

export type VerifiedSession =
  | { state: "signed-out" }
  /** Token exists but the user was deleted or their role changed since sign-in. */
  | { state: "stale"; tokenRole: Role }
  | {
      state: "ok";
      user: SessionUser;
      vendor: { id: string; storeName: string; slug: string; status: "PENDING" | "APPROVED" | "SUSPENDED" } | null;
    };

/** The session user re-read from the DB. Role, vendorId and vendorStatus come from the DB, not the token. */
export const getVerifiedSession = cache(async (): Promise<VerifiedSession> => {
  const session = await auth();
  const token = session?.user;
  if (!token?.id || !token.role) return { state: "signed-out" };

  const dbUser = await prisma.user.findUnique({
    where: { id: token.id },
    select: {
      name: true,
      email: true,
      role: true,
      vendor: { select: { id: true, storeName: true, slug: true, status: true } },
    },
  });
  if (!dbUser || dbUser.role !== token.role) return { state: "stale", tokenRole: token.role };

  return {
    state: "ok",
    user: {
      ...token,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      vendorId: dbUser.vendor?.id ?? null,
      vendorStatus: dbUser.vendor?.status ?? null,
    },
    vendor: dbUser.vendor,
  };
});

/** Auth pages (login/register): a signed-in user is sent to their own area instead. */
export async function redirectIfSignedIn(): Promise<void> {
  const session = await getVerifiedSession();
  if (session.state === "ok") redirect(getRoleHome(session.user));
  if (session.state === "stale") redirect(SESSION_ENDED_PATH);
}

/**
 * Signed-in user with `role` (checked against the DB), otherwise redirect:
 * signed out -> that role's login page; stale token -> session cleared; wrong role -> own home.
 */
export const requireRole = cache(async (role: Role): Promise<SessionUser> => {
  const session = await getVerifiedSession();
  if (session.state === "signed-out") {
    redirect(`${loginPathForRole(role)}?callbackUrl=${encodeURIComponent(areaRoot[role])}`);
  }
  if (session.state === "stale") redirect(SESSION_ENDED_PATH);
  if (session.user.role !== role) redirect(getRoleHome(session.user));
  return session.user;
});

/**
 * Vendor whose store is APPROVED right now, per the DB (the token copy may be stale).
 * PENDING, SUSPENDED or missing store -> /vendor/pending.
 */
export const requireApprovedVendor = cache(async () => {
  const user = await requireRole("VENDOR");
  const session = await getVerifiedSession(); // cached: no second query
  const vendor = session.state === "ok" ? session.vendor : null;
  if (!vendor || vendor.status !== "APPROVED") redirect("/vendor/pending");
  return { user, vendor };
});

/** Reads `callbackUrl` from page searchParams (first value if repeated). Sanitised later, server-side. */
export function readCallbackUrl(params: Record<string, string | string[] | undefined>): string | undefined {
  const raw = params.callbackUrl;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value || undefined;
}
