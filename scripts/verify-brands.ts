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
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import type { Role } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { countProductsByBrand, listBrands } from "@/lib/brands/queries";
import { createBrandSchema, parseBrandListParams, updateBrandSchema } from "@/lib/brands/schema";
import { createBrand, deleteBrand, setBrandStatus, updateBrand } from "@/lib/brands/service";

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

// ------------------------------------------------------------------------------ detail page

async function checkDetailPage(admin: Jar, customer: Jar, vendor: Jar) {
  console.log("\n# /admin/brands/[id]");
  const brand = await prisma.brand.create({
    data: { name: "Verify Detail Brand", slug: `${SLUG_PREFIX}detail`, status: "INACTIVE" },
  });
  const path = `/admin/brands/${brand.id}`;
  await expectRedirect("guest", undefined, path, "/admin/login");
  await expectRedirect("customer", customer, path, "/dashboard");
  await expectRedirect("vendor", vendor, path, "/vendor/dashboard");

  const ok = await get(path, admin);
  check("admin: existing id -> 200", ok.status === 200, ok.status);
  check("admin: name, slug and Inactive badge shown", ok.body.includes("Verify Detail Brand") && ok.body.includes(`${SLUG_PREFIX}detail`) && ok.body.includes(">Inactive<"));
  check("admin: breadcrumb Dashboard / Brands / name", /aria-label="Breadcrumb"[\s\S]*?href="\/admin\/brands"[^>]*>Brands<[\s\S]*?aria-current="page"[^>]*>Verify Detail Brand</.test(ok.body));
  check("admin: stats show 0 products", ok.body.includes("Total products") && ok.body.includes("On sale") && ok.body.includes("Not on sale"));
  check("admin: empty product table 'No products yet'", ok.body.includes("No products yet"));
  check("admin: Edit button present", ok.body.includes(">Edit<"));

  const missing = await get("/admin/brands/cm0000000000000000000000", admin);
  check("admin: unknown id -> 404", missing.status === 404, missing.status);
  const junk = await get("/admin/brands/not-an-id", admin);
  check("admin: malformed id -> 404", junk.status === 404, junk.status);
}

// ------------------------------------------------------------------------------ service + storage

const PNG_1x1 = Uint8Array.from(
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==", "base64"),
);
const png = (name = "a.png") => new File([PNG_1x1], name, { type: "image/png" });
const diskPath = (publicPath: string | null) =>
  publicPath ? path.join(process.cwd(), "storage", "uploads", "brands", path.basename(publicPath)) : "";
const storedFiles = () => {
  const dir = path.join(process.cwd(), "storage", "uploads", "brands");
  return existsSync(dir) ? readdirSync(dir).length : 0;
};

async function checkServiceAndStorage() {
  console.log("\n# service + storage");
  const filesBefore = storedFiles();

  // Create with an image.
  const a = await createBrand(createBrandSchema.parse({ name: "Brands Verify Alpha", image: png(), status: "ACTIVE" }));
  if (!a.ok) return check("create with image", false, a);
  const alpha = a.data;
  check("create: record exists, slug from name", (await prisma.brand.count({ where: { id: alpha.id } })) === 1 && alpha.slug === "brands-verify-alpha", alpha.slug);
  check("create: image file exists on disk (uuid.png)", /^\/media\/brands\/[0-9a-f-]{36}\.png$/.test(alpha.image ?? "") && existsSync(diskPath(alpha.image)), alpha.image);
  const afterCreate = storedFiles();

  // Duplicate names: same, other case, other accents.
  for (const [label, name] of [["same name", "Brands Verify Alpha"], ["other case", "BRANDS VERIFY alpha"], ["other accents", "Brands Vérify Álpha"]] as const) {
    const dup = await createBrand(createBrandSchema.parse({ name, image: png(), status: "ACTIVE" }));
    check(`duplicate (${label}) -> friendly error, no leftover file`, !dup.ok && dup.error === "A brand with this name already exists" && dup.field === "name" && storedFiles() === afterCreate, dup);
  }

  // Image rules.
  const big = createBrandSchema.safeParse({ name: "Brands Verify Big", image: new File([new Uint8Array(5 * 1024 * 1024)], "big.png", { type: "image/png" }), status: "ACTIVE" });
  check("5 MB image -> rejected by schema", !big.success);
  const pdf = new File([Buffer.from("%PDF-1.4\n%fake\n")], "doc.jpg", { type: "image/jpeg" });
  const pdfParsed = createBrandSchema.safeParse({ name: "Brands Verify Pdf", image: pdf, status: "ACTIVE" });
  const pdfResult = pdfParsed.success ? await createBrand(pdfParsed.data) : null;
  check("PDF renamed .jpg (MIME image/jpeg) -> rejected by magic bytes", pdfResult !== null && !pdfResult.ok && pdfResult.field === "image", pdfResult);
  check("rejected uploads leave no file and no record", storedFiles() === afterCreate && (await prisma.brand.count({ where: { slug: { in: ["brands-verify-big", "brands-verify-pdf"] } } })) === 0);

  // Slugs.
  const b = await createBrand(createBrandSchema.parse({ name: "Brands-Verify Alpha!", image: png(), status: "ACTIVE" }));
  check("same slug from another name -> '-2' suffix", b.ok && b.data.slug === "brands-verify-alpha-2", b.ok ? b.data.slug : b);

  // Update: rename keeps slug, no image keeps image.
  const upd = await updateBrand(alpha.id, updateBrandSchema.parse({ name: "Brands Verify Renamed", status: "ACTIVE" }));
  check("update without image: slug unchanged, image unchanged", upd.ok && upd.data.slug === alpha.slug && upd.data.image === alpha.image && upd.data.name === "Brands Verify Renamed", upd);
  check("update without image: file still there", existsSync(diskPath(alpha.image)));

  // Update with a new image deletes the old file.
  const withNew = await updateBrand(alpha.id, updateBrandSchema.parse({ name: "Brands Verify Renamed", image: png("b.png"), status: "ACTIVE" }));
  check("update with new image: image changed, new file exists, old file deleted", withNew.ok && withNew.data.image !== alpha.image && existsSync(diskPath(withNew.data.image)) && !existsSync(diskPath(alpha.image)), withNew);

  // Status persists.
  await setBrandStatus(alpha.id, "INACTIVE");
  check("status change persisted", (await prisma.brand.findUnique({ where: { id: alpha.id } }))?.status === "INACTIVE");

  // listBrands: search, status filter, pagination.
  await prisma.brand.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({ name: `Brands Verify List ${String(i + 1).padStart(2, "0")}`, slug: `${SLUG_PREFIX}list-${i + 1}`, status: i % 3 === 0 ? ("INACTIVE" as const) : ("ACTIVE" as const) })),
  });
  const q = (o: Record<string, string>) => parseBrandListParams(o);
  const searched = await listBrands(q({ q: "verify list 05", pageSize: "50" }));
  check("listBrands: search -> 1", searched.total === 1 && searched.items.length === 1, searched.total);
  const inactive = await listBrands(q({ q: "Brands Verify List", status: "INACTIVE", pageSize: "50" }));
  check("listBrands: status filter -> 4 inactive", inactive.total === 4 && inactive.items.every((x) => x.status === "INACTIVE"), inactive.total);
  const p1 = await listBrands(q({ q: "Brands Verify List", pageSize: "10" }));
  const p2 = await listBrands(q({ q: "Brands Verify List", pageSize: "10", page: "2" }));
  const p9 = await listBrands(q({ q: "Brands Verify List", pageSize: "10", page: "9" }));
  check("listBrands: pagination 12 rows -> 10 + 2, no overlap, page past end -> last page",
    p1.items.length === 10 && p2.items.length === 2 && p1.pageCount === 2 && new Set([...p1.items, ...p2.items].map((x) => x.id)).size === 12 && p9.page === 2 && p9.items.length === 2,
    { p1: p1.items.length, p2: p2.items.length, p9: p9.page });
  check("countProductsByBrand -> 0 (no Product model yet)", (await countProductsByBrand(alpha.id)) === 0);

  // Delete removes record and file.
  const lastImage = withNew.ok ? withNew.data.image : null;
  const del = await deleteBrand(alpha.id);
  check("delete: record and image file gone", del.ok && (await prisma.brand.count({ where: { id: alpha.id } })) === 0 && !existsSync(diskPath(lastImage)), del);
  const again = await deleteBrand(alpha.id);
  check("delete again -> 'no longer exists'", !again.ok, again);

  // Clean the files of everything created here (cleanup() removes the rows after this).
  for (const row of await prisma.brand.findMany({ where: { slug: { startsWith: SLUG_PREFIX } }, select: { id: true } })) await deleteBrand(row.id);
  check("no image files left behind by this section", storedFiles() === filesBefore, { before: filesBefore, after: storedFiles() });
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
  await checkDetailPage(admin, customer, vendor);
  await checkServiceAndStorage();
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
