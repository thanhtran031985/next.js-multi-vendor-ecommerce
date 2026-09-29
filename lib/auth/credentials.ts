// Credentials check for the NextAuth Credentials provider. Server-only (Prisma + bcrypt):
// import it from auth.ts, never from auth.config.ts or proxy.ts.

import bcrypt from "bcryptjs";
import type { User } from "next-auth";
import { prisma } from "@/lib/prisma";
import type { RoleUser } from "@/lib/auth/roles";
import { loginSchema } from "@/lib/validation/auth";

// bcrypt (cost 12) of a random string that was thrown away. Compared against when the email
// is unknown so that "no such user" costs the same time as "wrong password".
const DUMMY_HASH = "$2b$12$kXRKu1AQQr3qptb1cFEHJeKJfniBZzEfRbQKea0JUR.OD2sz/DEdC";

/** Role + vendor status for redirect decisions after sign-in (read from the DB, not the JWT). */
export async function findRoleUser(email: string): Promise<RoleUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true, vendor: { select: { status: true } } },
  });
  return user ? { role: user.role, vendorStatus: user.vendor?.status ?? null } : null;
}

/**
 * Returns the session user for valid credentials, otherwise null. Every failure (bad input,
 * unknown email, wrong password) returns the same null, so callers can only ever show the
 * generic INVALID_CREDENTIALS message.
 */
export async function verifyCredentials(input: unknown): Promise<User | null> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      vendor: { select: { id: true, status: true } },
    },
  });

  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    vendorId: user.vendor?.id ?? null,
    vendorStatus: user.vendor?.status ?? null,
  };
}
