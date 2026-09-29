// Seeds the single ADMIN account. Idempotent: safe to run any number of times.
//
// Env (loaded from .env by the Prisma CLI):
//   ADMIN_EMAIL     required
//   ADMIN_PASSWORD  >= 12 chars. Empty in development -> a random password is generated
//                   and printed once (only when the admin is first created). Empty in
//                   production -> error.
//
// The password hash is never printed.

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const BCRYPT_COST = 12;
const ADMIN_NAME = "Covet Admin";

const envSchema = z.object({
  ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email("ADMIN_EMAIL must be a valid email")),
  ADMIN_PASSWORD: z
    .string()
    .optional()
    .transform((v) => v ?? "")
    .refine((v) => v === "" || v.length >= 12, "ADMIN_PASSWORD must be at least 12 characters"),
});

const prisma = new PrismaClient();

async function main() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: envPassword } = parsed.data;

  if (envPassword === "" && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_PASSWORD is required in production");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true },
  });

  if (existing && existing.role !== "ADMIN") {
    throw new Error(`${email} is already registered with role ${existing.role}; refusing to promote it`);
  }

  if (existing) {
    // Admin exists. Only rotate the hash when an explicit password is set and differs.
    if (envPassword !== "" && !(await bcrypt.compare(envPassword, existing.passwordHash))) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: await bcrypt.hash(envPassword, BCRYPT_COST) },
      });
      console.log(`Admin ${email}: password updated from ADMIN_PASSWORD.`);
    } else {
      console.log(`Admin ${email}: already exists, no changes.`);
    }
    return;
  }

  const generated = envPassword === "";
  const password = generated ? randomBytes(18).toString("base64url") : envPassword;

  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
    },
  });

  console.log(`Admin ${email}: created.`);
  if (generated) {
    console.log("ADMIN_PASSWORD was empty, generated a development password (shown only once):");
    console.log(`  ${password}`);
    console.log("Store it now, or set ADMIN_PASSWORD in .env and re-run the seed to replace it.");
  }
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
