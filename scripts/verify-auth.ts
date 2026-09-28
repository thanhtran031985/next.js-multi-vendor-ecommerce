// Server-side auth checks against the real database, using the same functions the app uses.
//
//   npx tsx --env-file=.env scripts/verify-auth.ts
//
// Creates users under @verify.covet.test and deletes them at the end (also on failure).
// Exits with code 1 if any check fails.

import bcrypt from "bcryptjs";
import { verifyCredentials } from "@/lib/auth/credentials";
import { EMAIL_TAKEN, INVALID_CREDENTIALS } from "@/lib/auth/messages";
import { registerCustomer, registerVendor } from "@/lib/auth/register";
import { getRoleHome, safeCallbackUrl } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

const DOMAIN = "@verify.covet.test";
const PASSWORD = "Verify12345";
const STORE = "Verify Script Studio";

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail !== undefined ? `  -> ${JSON.stringify(detail)}` : ""}`);
}

async function cleanup() {
  const { count } = await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  return count;
}

async function main() {
  await cleanup(); // leftovers from an interrupted run

  console.log("\n# Customer registration");
  const customer = await registerCustomer({
    name: "Vera Buyer",
    email: `  Vera${DOMAIN.toUpperCase()} `,
    password: PASSWORD,
    acceptTerms: true,
  });
  check("registerCustomer succeeds", customer.ok, customer);
  const customerRow = customer.ok ? await prisma.user.findUnique({ where: { id: customer.userId } }) : null;
  check("email trimmed + lowercased", customerRow?.email === `vera${DOMAIN}`, customerRow?.email);
  check("role is CUSTOMER", customerRow?.role === "CUSTOMER", customerRow?.role);
  check("password stored only as bcrypt(12) hash", !!customerRow && customerRow.passwordHash !== PASSWORD && customerRow.passwordHash.startsWith("$2b$12$"));
  check("hash verifies the password", !!customerRow && (await bcrypt.compare(PASSWORD, customerRow.passwordHash)));
  check("no Vendor row for a customer", (await prisma.vendor.count({ where: { userId: customer.ok ? customer.userId : "" } })) === 0);

  console.log("\n# Vendor registration");
  const v1 = await registerVendor({ name: "Vic One", storeName: STORE, email: `vic1${DOMAIN}`, password: PASSWORD, confirmPassword: PASSWORD });
  const v2 = await registerVendor({ name: "Vic Two", storeName: STORE, email: `vic2${DOMAIN}`, password: PASSWORD, confirmPassword: PASSWORD });
  check("registerVendor succeeds (x2, same store name)", v1.ok && v2.ok, { v1, v2 });
  const vendors = await prisma.vendor.findMany({
    where: { user: { email: { endsWith: DOMAIN } } },
    include: { user: { select: { role: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  check("each vendor user has exactly one Vendor row", vendors.length === 2, vendors.length);
  check("Vendor.status is PENDING", vendors.every((v) => v.status === "PENDING"), vendors.map((v) => v.status));
  check("User.role is VENDOR", vendors.every((v) => v.user.role === "VENDOR"));
  check(
    "slugs are unique: base and base-2",
    vendors[0]?.slug === "verify-script-studio" && vendors[1]?.slug === "verify-script-studio-2",
    vendors.map((v) => v.slug),
  );
  const vendorUser = await verifyCredentials({ email: `vic1${DOMAIN}`, password: PASSWORD });
  check("vendor session user carries vendorId + PENDING", vendorUser?.vendorId === vendors[0]?.id && vendorUser?.vendorStatus === "PENDING", vendorUser);
  check("PENDING vendor home is /vendor/pending", vendorUser ? getRoleHome(vendorUser) === "/vendor/pending" : false);

  console.log("\n# Duplicate email (one email = one account = one role)");
  const dupVendor = await registerVendor({ name: "Dup", storeName: "Dup Store", email: `VERA${DOMAIN}`, password: PASSWORD, confirmPassword: PASSWORD });
  check("vendor with a customer's email (different case) rejected", !dupVendor.ok && dupVendor.fieldErrors.email === EMAIL_TAKEN, dupVendor);
  const dupCustomer = await registerCustomer({ name: "Dup", email: `vic1${DOMAIN}`, password: PASSWORD, acceptTerms: true });
  check("customer with a vendor's email rejected", !dupCustomer.ok && dupCustomer.fieldErrors.email === EMAIL_TAKEN, dupCustomer);
  check("rejected vendor left no Vendor row", (await prisma.vendor.count({ where: { storeName: "Dup Store" } })) === 0);
  check("still exactly one user per email", (await prisma.user.count({ where: { email: `vera${DOMAIN}` } })) === 1);

  console.log("\n# Weak passwords rejected");
  const weak: [string, string][] = [
    ["abcdefgh", "Password must contain a number"],
    ["12345678", "Password must contain a letter"],
    ["abc123", "Password must be at least 8 characters"],
  ];
  for (const [password, message] of weak) {
    const r = await registerCustomer({ name: "Weak Pass", email: `weak${DOMAIN}`, password, acceptTerms: true });
    check(`"${password}" -> ${message}`, !r.ok && r.fieldErrors.password === message, r);
  }
  const mismatch = await registerVendor({ name: "Mis Match", storeName: "Mismatch", email: `mis${DOMAIN}`, password: PASSWORD, confirmPassword: `${PASSWORD}x` });
  check("vendor confirmPassword mismatch rejected", !mismatch.ok && mismatch.fieldErrors.confirmPassword === "Passwords do not match", mismatch);
  check("no user created by rejected attempts", (await prisma.user.count({ where: { email: { in: [`weak${DOMAIN}`, `mis${DOMAIN}`] } } })) === 0);

  console.log("\n# authorize() (verifyCredentials)");
  const good = await verifyCredentials({ email: `vera${DOMAIN}`, password: PASSWORD });
  check("correct password -> user (no hash exposed)", good?.role === "CUSTOMER" && !("passwordHash" in (good ?? {})), good);
  const wrong = await verifyCredentials({ email: `vera${DOMAIN}`, password: "Wrong12345" });
  const unknown = await verifyCredentials({ email: `nobody${DOMAIN}`, password: PASSWORD });
  const malformed = await verifyCredentials({ email: "not-an-email", password: "" });
  check("wrong password -> null", wrong === null);
  check("unknown email -> null (same result as wrong password)", unknown === null);
  check("malformed input -> null", malformed === null);
  check(`every failure maps to the one generic message: "${INVALID_CREDENTIALS}"`, INVALID_CREDENTIALS === "Invalid email or password");

  console.log("\n# callbackUrl safety");
  const cust = { role: "CUSTOMER" as const };
  check("https://evil.com ignored", safeCallbackUrl("https://evil.com", cust) === "/dashboard");
  check("//evil.com ignored", safeCallbackUrl("//evil.com", cust) === "/dashboard");
  check("another role's area ignored", safeCallbackUrl("/admin/dashboard", cust) === "/dashboard");
  check("own area kept", safeCallbackUrl("/dashboard/orders?page=2", cust) === "/dashboard/orders?page=2");
}

main()
  .catch((err: unknown) => {
    failures++;
    console.error("Unexpected error:", err instanceof Error ? err.message : err);
  })
  .finally(async () => {
    const removed = await cleanup().catch(() => -1);
    console.log(`\ncleanup: removed ${removed} test user(s) (vendors cascade)`);
    await prisma.$disconnect();
    console.log(failures ? `${failures} CHECK(S) FAILED` : "ALL CHECKS PASSED");
    process.exitCode = failures ? 1 : 0;
  });
