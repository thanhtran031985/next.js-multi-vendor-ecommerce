// Route protection (Next 16 proxy, formerly middleware). Imports ONLY the edge-safe config:
// no Prisma, no bcrypt. The rules live in authConfig.callbacks.authorized.

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/vendor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
