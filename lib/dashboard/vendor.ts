// Data for the seller dashboard (/vendor/dashboard). The page only calls this loader; it
// never queries Prisma itself. Selects exactly the fields shown — never the password hash.
// Widgets backed by models that don't exist yet return empty values (see TODOs).

import type { VendorStatus } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import type { ChartPoint, DeliveryPerson, OrderStatusCounts, RatedProduct, TopProduct } from "@/lib/dashboard/types";

export type VendorWallet = {
  withdrawableBalance: number;
  pendingWithdraw: number;
  alreadyWithdrawn: number;
  totalTax: number;
  totalCommission: number;
  deliveryChargeEarned: number;
  collectedCash: number;
};

export type VendorDashboard = {
  owner: { name: string; email: string };
  store: { storeName: string; slug: string; status: VendorStatus; createdAt: Date };
  orderStatusCounts: OrderStatusCounts;
  /** null until payouts exist. */
  wallet: VendorWallet | null;
  /** Income vs commission given, per period. */
  earnings: ChartPoint[];
  mostRatedProducts: RatedProduct[];
  topSellingProducts: TopProduct[];
  topDeliveryMen: DeliveryPerson[];
};

export async function getVendorDashboard(userId: string): Promise<VendorDashboard> {
  const vendor = await prisma.vendor.findUniqueOrThrow({
    where: { userId },
    select: {
      storeName: true,
      slug: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return {
    owner: { name: vendor.user.name, email: vendor.user.email },
    store: { storeName: vendor.storeName, slug: vendor.slug, status: vendor.status, createdAt: vendor.createdAt },
    orderStatusCounts: null, // TODO(orders): count this store's orders by status
    wallet: null, // TODO(payouts): vendor balance, withdrawals, commission, tax, delivery charge
    earnings: [], // TODO(orders): income and commission per month/week/day
    mostRatedProducts: [], // TODO(products, reviews): top-rated products of this store
    topSellingProducts: [], // TODO(products, orders): best sellers of this store
    topDeliveryMen: [], // TODO(delivery): delivery people ranked for this store
  };
}
