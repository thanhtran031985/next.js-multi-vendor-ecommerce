// Role/area rules shared by the proxy, server actions and pages.
// Pure and edge-safe: no Prisma, no bcrypt, no Node APIs.

export type Role = "CUSTOMER" | "VENDOR" | "ADMIN";
export type VendorStatus = "PENDING" | "APPROVED" | "SUSPENDED";

export type RoleUser = {
  role: Role;
  vendorStatus?: VendorStatus | null;
};

export const AUTH_PAGES = [
  "/login",
  "/register",
  "/vendor/login",
  "/vendor/register",
  "/admin/login",
] as const;

/** True when `pathname` is `prefix` itself or a sub-path of it (`/admin` matches `/admin/x`, not `/administrator`). */
export function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page);
}

/**
 * Role a path requires, or null when it is public. Vendor *status* is not checked here:
 * the /vendor/dashboard layout re-reads it from the DB.
 */
export function requiredRoleForPath(pathname: string): Role | null {
  if (isUnder(pathname, "/dashboard")) return "CUSTOMER";
  if (isUnder(pathname, "/vendor/dashboard") || pathname === "/vendor/pending") return "VENDOR";
  if (isUnder(pathname, "/admin") && pathname !== "/admin/login") return "ADMIN";
  return null;
}

/** Where a signed-in user lands by default. */
export function getRoleHome(user: RoleUser): string {
  switch (user.role) {
    case "CUSTOMER":
      return "/dashboard";
    case "VENDOR":
      return user.vendorStatus === "APPROVED" ? "/vendor/dashboard" : "/vendor/pending";
    case "ADMIN":
      return "/admin/dashboard";
  }
}

export function loginPathForRole(role: Role): string {
  switch (role) {
    case "CUSTOMER":
      return "/login";
    case "VENDOR":
      return "/vendor/login";
    case "ADMIN":
      return "/admin/login";
  }
}

/** Login page for the area a path belongs to (used when a signed-out visitor hits a protected page). */
export function loginPathForPath(pathname: string): string {
  if (isUnder(pathname, "/admin")) return "/admin/login";
  if (isUnder(pathname, "/vendor")) return "/vendor/login";
  return "/login";
}

/**
 * Whether a signed-in user may be sent to `pathname` (e.g. as a callbackUrl).
 * Role only: vendor status is enforced by the /vendor/dashboard layout against the DB.
 * - VENDOR: /vendor/dashboard/* and /vendor/pending.
 * - ADMIN:  /admin/* except /admin/login.
 * - CUSTOMER: /dashboard/* and the storefront, i.e. anything outside /vendor and /admin.
 * Auth pages are never a valid destination.
 */
export function isPathAllowedForRole(pathname: string, role: Role): boolean {
  if (isAuthPage(pathname)) return false;
  switch (role) {
    case "VENDOR":
      return isUnder(pathname, "/vendor/dashboard") || pathname === "/vendor/pending";
    case "ADMIN":
      return isUnder(pathname, "/admin");
    case "CUSTOMER":
      return !isUnder(pathname, "/vendor") && !isUnder(pathname, "/admin");
  }
}

// Fixed origin used only to parse relative URLs; never appears in the output.
const PARSE_BASE = "http://covet.invalid";

/**
 * Sanitises a user-supplied callbackUrl. Returns a same-origin relative path inside the
 * user's own area, otherwise the role home. Rejects absolute URLs, protocol-relative
 * (`//host`) and backslash (`/\host`) forms, and anything that resolves off-origin.
 */
export function safeCallbackUrl(raw: unknown, user: RoleUser): string {
  const home = getRoleHome(user);
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return home;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return home;

  let url: URL;
  try {
    url = new URL(raw, PARSE_BASE);
  } catch {
    return home;
  }
  // The URL parser strips tabs/newlines, so "/\t/evil.com" becomes "//evil.com": catch it here.
  if (url.origin !== PARSE_BASE) return home;
  if (!isPathAllowedForRole(url.pathname, user.role)) return home;

  return `${url.pathname}${url.search}${url.hash}`;
}
