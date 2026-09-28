// Typed auth fields carried from authorize() -> JWT -> session.

import type { DefaultSession } from "next-auth";
import type { Role, VendorStatus } from "@/lib/auth/roles";

declare module "next-auth" {
  interface User {
    role: Role;
    vendorId: string | null;
    vendorStatus: VendorStatus | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      vendorId: string | null;
      vendorStatus: VendorStatus | null;
    } & DefaultSession["user"];
  }
}

// `next-auth/jwt` is only `export * from "@auth/core/jwt"`, and TypeScript cannot merge an
// interface through `export *`, so JWT is augmented at its source module.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    vendorId?: string | null;
    vendorStatus?: VendorStatus | null;
  }
}
