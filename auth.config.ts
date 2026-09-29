// Edge-safe NextAuth config: no providers that touch Prisma/bcrypt, no Prisma import.
// proxy.ts imports ONLY this file; auth.ts spreads it and adds the Credentials provider.

import type { NextAuthConfig } from "next-auth";
import { getRoleHome, isAuthPage, loginPathForPath, requiredRoleForPath } from "@/lib/auth/roles";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    /**
     * Runs in proxy.ts for every matched request. Checks the role from the token only
     * (vendor status is enforced by the /vendor/dashboard layout against the DB).
     * - auth page + signed in      -> own role home
     * - protected + signed out     -> the area's login page with callbackUrl
     * - protected + wrong role     -> own role home (never another role's page)
     */
    authorized({ request, auth }) {
      const { pathname, search } = request.nextUrl;
      const user = auth?.user?.role ? auth.user : null;

      if (isAuthPage(pathname)) {
        return user ? Response.redirect(new URL(getRoleHome(user), request.nextUrl)) : true;
      }

      const required = requiredRoleForPath(pathname);
      if (!required) return true;

      if (!user) {
        const login = new URL(loginPathForPath(pathname), request.nextUrl);
        login.searchParams.set("callbackUrl", `${pathname}${search}`);
        return Response.redirect(login);
      }

      if (user.role !== required) return Response.redirect(new URL(getRoleHome(user), request.nextUrl));
      return true;
    },
    // On sign-in, copy the fields returned by authorize() into the token.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.vendorId = user.vendorId ?? null;
        token.vendorStatus = user.vendorStatus ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && token.role) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.vendorId = token.vendorId ?? null;
        session.user.vendorStatus = token.vendorStatus ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
