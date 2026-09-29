// Data for the customer dashboard (/dashboard). The page only calls this loader; it never
// queries Prisma itself. Selects exactly the fields shown — never the password hash.

import "server-only";

import { prisma } from "@/lib/prisma";
import { splitName } from "@/lib/dashboard/format";

export type CustomerDashboard = {
  profile: {
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    /** No phone field on User yet. */
    phone: string | null;
    memberSince: Date;
  };
};

export async function getCustomerDashboard(userId: string): Promise<CustomerDashboard> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, createdAt: true },
  });
  const { first, last } = splitName(user.name);

  return {
    profile: {
      fullName: user.name,
      firstName: first,
      lastName: last,
      email: user.email,
      phone: null, // TODO(customer-profile): add User.phone and load it here
      memberSince: user.createdAt,
    },
  };
}
