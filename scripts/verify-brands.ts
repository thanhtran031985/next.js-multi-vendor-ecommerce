// Checks for brand management (task 03), against a running server:
//
//   npm run dev                (or npm run build && npm run start)
//   npx tsx --env-file=.env scripts/verify-brands.ts
//
// Base URL: VERIFY_BASE_URL, default http://localhost:3000.
// Creates users under @brands.verify.covet.test and brands whose slug starts with
// "brands-verify-", signs in through the real Auth.js credentials endpoint (plain fetch, no
// extra packages), and deletes everything it created at the end (also on failure).
// Exits with code 1 if any check fails.

import bcrypt from "bcryptjs";
import type { Role } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

const BASE = (process.env.VERIFY_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DOMAIN = "@brands.verify.covet.test";
const SLUG_PREFIX = "brands-verify-";
const PASSWORD = "Verify12345";

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail !== undefined ? `  -> ${JSON.stringify(detail)}` : ""}`);
}

async function cleanup() {
  const brands = await prisma.brand.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
  const users = await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  return { brands: brands.count, users: users.count };
}

async function createUser(email: string, role: Role) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await prisma.user.create({
    data: {
      email,
      name: `Verify ${role}`,
      role,
      passwordHash,
      ...(role === "VENDOR"
        ? { vendor: { create: { storeName: "Verify Store", slug: `${SLUG_PREFIX}store`, status: "APPROVED" } } }
        : {}),
    },
  });
}

// ------------------------------------------------------------------------------ HTTP helpers

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
  const body = res.status === 200 || res.status === 404 ? await res.text() : "";
  return { status: res.status, location: location ? new URL(location, BASE).pathname : null, body };
}

async function expectRedirect(label: string, jar: Jar | undefined, path: string, to: string) {
  const r = await get(path, jar);
  check(`${label}: ${path} -> ${to}`, r.status >= 300 && r.status < 400 && r.location === to, {
    status: r.status,
    location: r.location,
  });
}

/** Rows on a list page = "View <name>" row actions. */
const rowCount = (html: string) => (html.match(/aria-label="View /g) ?? []).length;
/** An <a> with this exact href and aria-current="page" (any attribute order) whose text includes `label`. */
function sidebarLinkIsCurrent(html: string, href: string, label: string): boolean {
  for (const m of html.matchAll(/<a\s([^>]*)>([\s\S]*?)<\/a>/g)) {
    const [, attrs, inner] = m;
    if (attrs.includes(`href="${href}"`) && attrs.includes('aria-current="page"') && inner.includes(label)) return true;
  }
  return false;
}

/** Current page number shown by the list pagination (null when there is a single page). */
function currentPage(html: string): number | null {
  const m = html.match(/aria-label="Brand list pages"[\s\S]*?aria-current="page"[^>]*>(\d+)</);
  return m ? Number(m[1]) : null;
}

// ------------------------------------------------------------------------------ list page

async function checkListPage(admin: Jar, customer: Jar, vendor: Jar) {
  console.log("\n# /admin/brands — access");
  await expectRedirect("guest", undefined, "/admin/brands", "/admin/login");
  await expectRedirect("customer", customer, "/admin/brands", "/dashboard");
  await expectRedirect("vendor", vendor, "/admin/brands", "/vendor/dashboard");

  const empty = (await prisma.brand.count()) === 0;
  if (empty) {
    const r = await get("/admin/brands", admin);
    check("admin: no brands yet -> empty state", r.status === 200 && r.body.includes("No brands yet"), r.status);
  } else {
    console.log("SKIP  empty state 'No brands yet' (the DB already has brands)");
  }

  // 23 brands: 15 active, 8 inactive.
  await prisma.brand.createMany({
    data: Array.from({ length: 23 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return { name: `Verify Brand ${n}`, slug: `${SLUG_PREFIX}${n}`, status: i < 15 ? "ACTIVE" : "INACTIVE" };
    }),
  });
  const total = await prisma.brand.count();

  console.log("\n# /admin/brands — admin");
  const list = await get("/admin/brands", admin);
  check("admin: /admin/brands -> 200", list.status === 200, list.status);
  check("admin: heading 'Brands' + total pill", list.body.includes(">Brands</h1>") && list.body.includes(`${total} brands in total`));
  check("admin: breadcrumb Dashboard / Brands", /aria-label="Breadcrumb"[\s\S]*?href="\/admin\/dashboard"[^>]*>Dashboard<[\s\S]*?aria-current="page"[^>]*>Brands</.test(list.body));
  check("admin: sidebar 'Brand Setup' is the current link", sidebarLinkIsCurrent(list.body, "/admin/brands", "Brand Setup"));
  check("admin: default page size 10 rows", rowCount(list.body) === 10, rowCount(list.body));

  const size20 = await get("/admin/brands?pageSize=20", admin);
  check("admin: ?pageSize=20 -> 20 rows", rowCount(size20.body) === 20, rowCount(size20.body));

  const lastPage = Math.ceil(total / 10);
  const far = await get("/admin/brands?page=999", admin);
  check("admin: ?page=999 -> 200", far.status === 200, far.status);
  check(`admin: ?page=999 shows the last page (${lastPage})`, currentPage(far.body) === lastPage, currentPage(far.body));

  const bad = await get("/admin/brands?pageSize=abc&page=-3&status=nope", admin);
  check("admin: ?pageSize=abc&page=-3&status=nope -> 200", bad.status === 200, bad.status);
  check("admin: invalid params fall back to page 1, 10 rows", currentPage(bad.body) === 1 && rowCount(bad.body) === 10, {
    page: currentPage(bad.body),
    rows: rowCount(bad.body),
  });

  const inactive = await get(`/admin/brands?status=INACTIVE&q=Verify%20Brand&pageSize=50`, admin);
  check("admin: ?status=INACTIVE&q=… -> 8 rows", rowCount(inactive.body) === 8, rowCount(inactive.body));

  const search = await get("/admin/brands?q=verify%20brand%2007", admin);
  check("admin: ?q= is case-insensitive -> 1 row", rowCount(search.body) === 1 && search.body.includes("Verify Brand 07"), rowCount(search.body));

  const none = await get("/admin/brands?q=zz-no-such-brand", admin);
  check("admin: no match -> 'No brands match your filters'", none.body.includes("No brands match your filters"));
  check("admin: no match -> 'Clear filters' link", /href="\/admin\/brands"[^>]*>Clear filters</.test(none.body));

  console.log("\n# admin shell around the new slot");
  const dash = await get("/admin/dashboard", admin);
  check("admin: /admin/dashboard still 200", dash.status === 200, dash.status);
  check("admin: /admin/dashboard breadcrumb is Home / Dashboard", /aria-label="Breadcrumb"[\s\S]*?href="\/"[^>]*>Home<[\s\S]*?aria-current="page"[^>]*>Dashboard</.test(dash.body));
  const unknown = await get("/admin/no-such-page", admin);
  check("admin: /admin/no-such-page -> 404", unknown.status === 404, unknown.status);
  const login = await get("/admin/login");
  check("guest: /admin/login still the login page (200)", login.status === 200 && /sign in/i.test(login.body), login.status);
}

// ------------------------------------------------------------------------------ main

async function main() {
  console.log(`Base URL: ${BASE}`);
  const before = await cleanup();
  if (before.brands || before.users) console.log(`Removed leftovers from a previous run: ${JSON.stringify(before)}`);

  await createUser(`admin${DOMAIN}`, "ADMIN");
  await createUser(`customer${DOMAIN}`, "CUSTOMER");
  await createUser(`vendor${DOMAIN}`, "VENDOR");
  const [admin, customer, vendor] = await Promise.all([
    signIn(`admin${DOMAIN}`),
    signIn(`customer${DOMAIN}`),
    signIn(`vendor${DOMAIN}`),
  ]);

  await checkListPage(admin, customer, vendor);
}

main()
  .catch((err) => {
    failures++;
    console.error(err);
  })
  .finally(async () => {
    const removed = await cleanup();
    console.log(`\nCleanup: ${JSON.stringify(removed)}`);
    await prisma.$disconnect();
    console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
    process.exit(failures ? 1 : 0);
  });
