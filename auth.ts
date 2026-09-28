// Full NextAuth instance (Node runtime): edge config + Credentials provider backed by Prisma.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verifyCredentials } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) => verifyCredentials(credentials),
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);

      // update() from the client: re-read vendor status from the DB (the source of truth).
      // Any payload the client sent with update() is deliberately ignored.
      if (params.trigger === "update" && token.role === "VENDOR" && token.id) {
        const vendor = await prisma.vendor.findUnique({
          where: { userId: token.id },
          select: { id: true, status: true },
        });
        token.vendorId = vendor?.id ?? null;
        token.vendorStatus = vendor?.status ?? null;
      }

      return token;
    },
  },
});
