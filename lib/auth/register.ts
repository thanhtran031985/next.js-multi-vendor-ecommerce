// Registration logic (validate -> check email -> hash -> create). Server-only.
// Called by the server actions in app/actions/auth.ts and by scripts/verify-auth.ts.

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { EMAIL_TAKEN } from "@/lib/auth/messages";
import { slugify, uniqueVendorSlug } from "@/lib/slug";
import {
  customerRegisterSchema,
  firstFieldErrors,
  vendorRegisterSchema,
  type CustomerRegisterField,
  type VendorRegisterField,
} from "@/lib/validation/auth";

const BCRYPT_COST = 12;
const SLUG_RETRIES = 3;

export type RegisterResult<Field extends string> =
  | { ok: true; userId: string; email: string }
  | { ok: false; fieldErrors: Partial<Record<Field, string>> };

/** Unique-constraint violation (P2002) on an index covering `field`. */
function isUniqueViolation(err: unknown, field: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  // MySQL reports the index name ("User_email_key"); other connectors report field names.
  const target = err.meta?.target;
  const text = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return text.includes(field);
}

async function emailTaken(email: string): Promise<boolean> {
  return (await prisma.user.findUnique({ where: { email }, select: { id: true } })) !== null;
}

export async function registerCustomer(input: unknown): Promise<RegisterResult<CustomerRegisterField>> {
  const parsed = customerRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: firstFieldErrors(parsed.error) };
  const { name, email, password } = parsed.data;

  if (await emailTaken(email)) return { ok: false, fieldErrors: { email: EMAIL_TAKEN } };

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "CUSTOMER" },
      select: { id: true },
    });
    return { ok: true, userId: user.id, email };
  } catch (err) {
    // Lost a race with another registration for the same email.
    if (isUniqueViolation(err, "email")) return { ok: false, fieldErrors: { email: EMAIL_TAKEN } };
    throw err;
  }
}

/** Creates User(role=VENDOR) + Vendor(status=PENDING) atomically, with a unique store slug. */
export async function registerVendor(input: unknown): Promise<RegisterResult<VendorRegisterField>> {
  const parsed = vendorRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: firstFieldErrors(parsed.error) };
  const { name, storeName, email, password } = parsed.data;

  if (await emailTaken(email)) return { ok: false, fieldErrors: { email: EMAIL_TAKEN } };

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const baseSlug = slugify(storeName);

  for (let attempt = 1; ; attempt++) {
    try {
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { name, email, passwordHash, role: "VENDOR" },
          select: { id: true },
        });
        await tx.vendor.create({
          data: {
            userId: created.id,
            storeName,
            slug: await uniqueVendorSlug(tx, baseSlug),
            status: "PENDING",
          },
        });
        return created;
      });
      return { ok: true, userId: user.id, email };
    } catch (err) {
      if (isUniqueViolation(err, "email")) return { ok: false, fieldErrors: { email: EMAIL_TAKEN } };
      // Another store took the same slug between our lookup and commit: pick again.
      if (isUniqueViolation(err, "slug") && attempt < SLUG_RETRIES) continue;
      throw err;
    }
  }
}
