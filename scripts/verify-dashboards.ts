// HTTP checks for the role dashboards (task 02), against a running server:
//
//   npm run build && npm run start          (or npm run dev)
//   npx tsx --env-file=.env scripts/verify-dashboards.ts
//
// Base URL: VERIFY_BASE_URL, default http://localhost:3000.
// Creates users under @dash.verify.covet.test, signs in through the real Auth.js
// credentials endpoint (plain fetch, no extra packages), requests each dashboard and
// deletes the users at the end (also on failure). Exits with code 1 if any check fails.

import bcrypt from "bcryptjs";
import type { Role, VendorStatus } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

const BASE = (process.env.VERIFY_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DOMAIN = "@dash.verify.covet.test";
const PASSWORD = "Verify12345";

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail !== undefined ? `  -> ${JSON.stringify(detail)}` : ""}`);
}

async function cleanup() {
  const { count } = await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  return count;
}

type TestUser = { email: string; name: string; role: Role; vendorStatus?: VendorStatus; storeName?: string };

async function createUser(u: TestUser) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  return prisma.user.create({
    data: {
      email: u.email,
      name: u.name,
      role: u.role,
      passwordHash,
      ...(u.role === "VENDOR" && u.storeName
        ? {
            vendor: {
              create: {
                storeName: u.storeName,
                slug: `dash-verify-${u.email.split("@")[0]}`,
                status: u.vendorStatus ?? "PENDING",
              },
            },
          }
        : {}),
    },
    select: { id: true },
  });
}

/** Minimal cookie jar: name -> value from Set-Cookie headers. */
class Jar {
  private cookies = new Map<string, string>();
  store(res: Response) {
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === "" || /max-age=0/i.test(line)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header() {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  has(fragment: string) {
    return [...this.cookies.keys()].some((k) => k.includes(fragment));
  }
}

/** Signs in through /api/auth/callback/credentials, like the login form does. */
async function signIn(email: string): Promise<Jar> {
  const jar = new Jar();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  jar.store(csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: jar.header() },
    body: new URLSearchParams({ csrfToken, email, password: PASSWORD, callbackUrl: `${BASE}/` }),
  });
  jar.store(res);
  return jar;
}

async function get(path: string, jar?: Jar) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual", headers: jar ? { cookie: jar.header() } : {} });
  const location = res.headers.get("location");
  const body = res.status === 200 ? await res.text() : "";
  return { status: res.status, location: location ? new URL(location, BASE).pathname : null, body };
}

async function expectPage(label: string, jar: Jar, path: string, markers: string[], absent: string[] = []) {
  const r = await get(path, jar);
  check(`${label}: ${path} -> 200`, r.status === 200, { status: r.status, location: r.location });
  if (r.status !== 200) return;
  for (const m of markers) check(`${label}: ${path} shows "${m}"`, r.body.includes(m));
  for (const a of absent) check(`${label}: ${path} does not contain "${a}"`, !r.body.includes(a));
}

async function expectRedirect(label: string, jar: Jar, path: string, to: string) {
  const r = await get(path, jar);
  check(`${label}: ${path} -> ${to}`, r.status >= 300 && r.status < 400 && r.location === to, r);
}

/** Number shown in the element marked data-stat="<key>" (StatCard / User Overview legend). */
function statValue(html: string, key: string): number | null {
  const m = html.match(new RegExp(`data-stat="${key}"[^>]*>([\\d,]+)<`));
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

function unescapeHtml(s: string) {
  return s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/** Admin figures must equal a direct SQL query (not the loader) run right after the request. */
async function checkAdminFiguresAgainstSql(jar: Jar) {
  const { body } = await get("/admin/dashboard", jar);
  const [row] = await prisma.$queryRaw<
    { customers: bigint; vendorUsers: bigint; pending: bigint; approved: bigint; suspended: bigint; stores: bigint }[]
  >`
    SELECT
      (SELECT COUNT(*) FROM \`User\` WHERE role = 'CUSTOMER') AS customers,
      (SELECT COUNT(*) FROM \`User\` WHERE role = 'VENDOR') AS vendorUsers,
      (SELECT COUNT(*) FROM \`Vendor\` WHERE status = 'PENDING') AS pending,
      (SELECT COUNT(*) FROM \`Vendor\` WHERE status = 'APPROVED') AS approved,
      (SELECT COUNT(*) FROM \`Vendor\` WHERE status = 'SUSPENDED') AS suspended,
      (SELECT COUNT(*) FROM \`Vendor\`) AS stores`;
  const expected: Record<string, number> = {
    customers: Number(row.customers),
    stores: Number(row.stores),
    "vendors-pending": Number(row.pending),
    "vendors-approved": Number(row.approved),
    "vendors-suspended": Number(row.suspended),
    "overview-customers": Number(row.customers),
    "overview-vendors": Number(row.vendorUsers),
  };
  for (const [key, value] of Object.entries(expected)) {
    const shown = statValue(body, key);
    check(`admin: ${key} = SQL (${value})`, shown === value, { shown, sql: value });
  }

  const recent = await prisma.$queryRaw<{ storeName: string }[]>`
    SELECT storeName FROM \`Vendor\` ORDER BY createdAt DESC, id DESC LIMIT 5`;
  const shownStores = [...body.matchAll(/data-store="([^"]*)"/g)].map((m) => unescapeHtml(m[1]));
  check(
    "admin: recent vendors = SQL (5 newest, newest first)",
    JSON.stringify(shownStores) === JSON.stringify(recent.map((r) => r.storeName)),
    { shown: shownStores, sql: recent.map((r) => r.storeName) },
  );
  check("admin: recent vendors list has no approve button", !/>\s*Approve\s*</.test(body));
}

async function main() {
  const probe = await fetch(`${BASE}/api/auth/csrf`).catch(() => null);
  if (!probe?.ok) {
    console.error(`No server at ${BASE}. Start it first (npm run start / npm run dev).`);
    process.exit(1);
  }

  await cleanup(); // leftovers from an interrupted run

  const users = {
    customer: { email: `cora${DOMAIN}`, name: "Cora Buyer", role: "CUSTOMER" },
    vendor: { email: `vina${DOMAIN}`, name: "Vina Seller", role: "VENDOR", vendorStatus: "APPROVED", storeName: "Vina Verify Store" },
    pending: { email: `pete${DOMAIN}`, name: "Pete Pending", role: "VENDOR", vendorStatus: "PENDING", storeName: "Pete Verify Store" },
    suspended: { email: `sue${DOMAIN}`, name: "Sue Suspended", role: "VENDOR", vendorStatus: "SUSPENDED", storeName: "Sue Verify Store" },
    admin: { email: `ada${DOMAIN}`, name: "Ada Admin", role: "ADMIN" },
  } satisfies Record<string, TestUser>;
  for (const u of Object.values(users)) await createUser(u);
  // Extra stores (never signed in) so there are more than 5 vendors and the admin
  // "5 newest registrations" list is really cut at 5.
  for (let i = 1; i <= 4; i++) {
    await createUser({ email: `extra${i}${DOMAIN}`, name: `Extra Seller ${i}`, role: "VENDOR", storeName: `Extra Verify Store ${i}` });
  }

  const jars = {} as Record<keyof typeof users, Jar>;
  console.log("\n# Sign in");
  for (const [key, u] of Object.entries(users) as [keyof typeof users, TestUser][]) {
    jars[key] = await signIn(u.email);
    check(`${key} signed in (session cookie set)`, jars[key].has("session-token"));
  }

  console.log("\n# Customer");
  await expectPage("customer", jars.customer, "/dashboard", [
    "Hello, Cora",
    "Profile Info",
    "Cora Buyer",
    'value="Cora"',
    'value="Buyer"',
    `value="cora${DOMAIN}"`,
    "Member since",
    "Update Profile",
    "Sign out",
    "Coming soon",
  ], [
    'href="/dashboard/orders"',
    "passwordHash",
  ]);
  await expectRedirect("customer", jars.customer, "/vendor/dashboard", "/dashboard");
  await expectRedirect("customer", jars.customer, "/admin/dashboard", "/dashboard");

  console.log("\n# Vendor");
  await expectPage("vendor APPROVED", jars.vendor, "/vendor/dashboard", [
    'aria-label="Sections"', // icon rail stays on the vendor frame (task 04)
    "Setup Guide",
    "v****@",
    "Logout",
    "Coming soon",
    "Welcome Vina Seller",
    "Vina Verify Store",
    "/dash-verify-vina",
    "Approved",
    "Since ",
    "Business Analytics",
    "Failed To Deliver",
    "Vendor Wallet",
    "Withdrawable Balance",
    "Earning Statistics",
    "No earnings yet",
    "No rated products yet",
    "No sales yet",
    "No deliveries yet",
    "No data yet",
  ], [
    'href="/vendor/dashboard/products"',
    "passwordHash",
    "10,081.50", // mockup demo figures must not leak into the page
    "James Dawson",
  ]);
  await expectPage("vendor PENDING", jars.pending, "/vendor/pending", ["Pete Verify Store"]);
  await expectRedirect("vendor PENDING", jars.pending, "/vendor/dashboard", "/vendor/pending");
  await expectRedirect("vendor SUSPENDED", jars.suspended, "/vendor/dashboard", "/vendor/pending");
  await expectRedirect("vendor APPROVED", jars.vendor, "/dashboard", "/vendor/dashboard");
  await expectRedirect("vendor APPROVED", jars.vendor, "/admin/dashboard", "/vendor/dashboard");

  console.log("\n# Admin");
  await expectPage(
    "admin",
    jars.admin,
    "/admin/dashboard",
    [
      'aria-label="Covet dashboard"', // logo moved to the top of the sidebar (task 04)
      "Search Menu...",
      "Master Admin",
      "Ada Admin",
      "Logout",
      "Welcome Ada Admin",
      "Business Analytics",
      "Total Stores",
      "Total Customers",
      "Failed To Delivery",
      "Admin Wallet",
      "Order Statistics",
      "User Overview",
      "Earning Statistics",
      "Vendors by Status",
      "Recent Vendor Registrations",
      "Most Popular Stores",
      "Inhouse Products",
      "Vendor Products",
      "No data yet",
    ],
    ['aria-label="Sections"', 'href="/admin/dashboard/products"', "passwordHash", "27,514.52", "Robert Downey"],
  );
  await checkAdminFiguresAgainstSql(jars.admin);
  await expectRedirect("admin", jars.admin, "/dashboard", "/admin/dashboard");
  await expectRedirect("admin", jars.admin, "/vendor/dashboard", "/admin/dashboard");

  console.log("\n# Signed out");
  const anon = new Jar();
  await expectRedirect("signed out", anon, "/dashboard", "/login");
  await expectRedirect("signed out", anon, "/vendor/dashboard", "/vendor/login");
  await expectRedirect("signed out", anon, "/admin/dashboard", "/admin/login");
}

main()
  .catch((err) => {
    failures++;
    console.error(err);
  })
  .finally(async () => {
    try {
      const removed = await cleanup();
      console.log(`\nCleanup: removed ${removed} test user(s).`);
    } catch (err) {
      failures++;
      console.error("\nCleanup failed (is the database running?):", err instanceof Error ? err.message.trim().split("\n").at(-1) : err);
    }
    await prisma.$disconnect();
    console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
    process.exit(failures === 0 ? 0 : 1);
  });
