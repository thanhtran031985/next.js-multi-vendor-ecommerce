// Data for the admin dashboard (/admin/dashboard). The page only calls this loader; it never
// queries Prisma itself. Only counts and the selected fields that are shown — never the
// password hash. Widgets backed by models that don't exist yet return empty values (TODOs).

import "server-only";

import type { VendorStatus } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import type {
  ChartPoint,
  DeliveryPerson,
  OrderStatusCounts,
  RatedProduct,
  StoreLikes,
  StoreSales,
  TopCustomer,
  TopProduct,
} from "@/lib/dashboard/types";

export type RecentVendor = { id: string; storeName: string; ownerEmail: string; status: VendorStatus; createdAt: Date };

export type AdminWallet = {
  totalEarning: number;
  commissionEarned: number;
  taxCollected: number;
  deliveryChargeEarned: number;
  pendingAmount: number;
};

export type AdminDashboard = {
  totals: {
    /** Registered stores (Vendor rows, any status). */
    stores: number;
    customers: number;
    orders: number | null;
    products: number | null;
  };
  vendorsByStatus: Record<VendorStatus, number>;
  /** Five most recent store registrations, newest first. Read-only on the dashboard. */
  recentVendors: RecentVendor[];
  /** "User Overview" legend: user accounts per kind. */
  userOverview: { customers: number; vendors: number; deliveryMen: number | null };
  orderStatusCounts: OrderStatusCounts;
  wallet: AdminWallet | null;
  /** Inhouse vs vendor orders per period. */
  orderStatistics: ChartPoint[];
  /** Inhouse vs vendor vs commission earnings per period. */
  earnings: ChartPoint[];
  topCustomers: TopCustomer[];
  topDeliveryMen: DeliveryPerson[];
  popularStores: StoreLikes[];
  topSellingStores: StoreSales[];
  inhouseMostRated: RatedProduct[];
  inhouseTopSelling: TopProduct[];
  vendorMostRated: RatedProduct[];
  vendorTopSelling: TopProduct[];
};

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const [customers, vendorUsers, pending, approved, suspended, recent] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "VENDOR" } }),
    prisma.vendor.count({ where: { status: "PENDING" } }),
    prisma.vendor.count({ where: { status: "APPROVED" } }),
    prisma.vendor.count({ where: { status: "SUSPENDED" } }),
    prisma.vendor.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
      select: { id: true, storeName: true, status: true, createdAt: true, user: { select: { email: true } } },
    }),
  ]);

  return {
    totals: {
      stores: pending + approved + suspended,
      customers,
      orders: null, // TODO(orders): total orders
      products: null, // TODO(products): total products
    },
    vendorsByStatus: { PENDING: pending, APPROVED: approved, SUSPENDED: suspended },
    recentVendors: recent.map((v) => ({
      id: v.id,
      storeName: v.storeName,
      ownerEmail: v.user.email,
      status: v.status,
      createdAt: v.createdAt,
    })),
    userOverview: {
      customers,
      vendors: vendorUsers,
      deliveryMen: null, // TODO(delivery): delivery accounts
    },
    orderStatusCounts: null, // TODO(orders): orders by status, platform-wide
    wallet: null, // TODO(payouts): admin earning, commission, tax, delivery charge, pending
    orderStatistics: [], // TODO(orders): inhouse vs vendor orders per month/week/day
    earnings: [], // TODO(orders, payouts): inhouse vs vendor vs commission per period
    topCustomers: [], // TODO(orders): customers ranked by order count
    topDeliveryMen: [], // TODO(delivery): delivery people ranked by deliveries
    popularStores: [], // TODO(store-follows): stores ranked by likes
    topSellingStores: [], // TODO(orders): stores ranked by sales
    inhouseMostRated: [], // TODO(products, reviews): inhouse products by rating
    inhouseTopSelling: [], // TODO(products, orders): inhouse best sellers
    vendorMostRated: [], // TODO(products, reviews): vendor products by rating
    vendorTopSelling: [], // TODO(products, orders): vendor best sellers
  };
}
