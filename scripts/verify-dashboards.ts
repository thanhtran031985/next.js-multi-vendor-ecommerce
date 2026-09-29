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

  const jars = {} as Record<keyof typeof users, Jar>;
  console.log("\n# Sign in");
  for (const [key, u] of Object.entries(users) as [keyof typeof users, TestUser][]) {
    jars[key] = await signIn(u.email);
    check(`${key} signed in (session cookie set)`, jars[key].has("session-token"));
  }

  console.log("\n# Customer");
  await expectPage("customer", jars.customer, "/dashboard", ["Hello, Cora", "Profile Info", "Cora Buyer", `cora${DOMAIN}`, "Sign out", "Coming soon"], [
    'href="/dashboard/orders"',
    "passwordHash",
  ]);
  await expectRedirect("customer", jars.customer, "/vendor/dashboard", "/dashboard");
  await expectRedirect("customer", jars.customer, "/admin/dashboard", "/dashboard");

  console.log("\n# Vendor");
  await expectPage("vendor APPROVED", jars.vendor, "/vendor/dashboard", ["Setup Guide", "Vina Verify Store", "v****@", "Logout", "Coming soon"], [
    'href="/vendor/dashboard/products"',
    "passwordHash",
  ]);
  await expectRedirect("vendor PENDING", jars.pending, "/vendor/dashboard", "/vendor/pending");
  await expectRedirect("vendor SUSPENDED", jars.suspended, "/vendor/dashboard", "/vendor/pending");
  await expectRedirect("vendor APPROVED", jars.vendor, "/dashboard", "/vendor/dashboard");
  await expectRedirect("vendor APPROVED", jars.vendor, "/admin/dashboard", "/vendor/dashboard");

  console.log("\n# Admin");
  await expectPage("admin", jars.admin, "/admin/dashboard", ["Search Menu...", "Master Admin", "Ada Admin", "Logout"], [
    'href="/admin/dashboard/products"',
    "passwordHash",
  ]);
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
