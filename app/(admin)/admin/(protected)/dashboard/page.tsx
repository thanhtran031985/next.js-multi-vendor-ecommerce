import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BanIcon, ChevronDownIcon, ClockIcon, HeartIcon, TruckIcon, UserIcon } from "@/components/icons";
import {
  BarChartIcon,
  BoxIcon,
  CheckCircleIcon,
  DollarIcon,
  FileTextIcon,
  PercentIcon,
  StarIcon,
  StoreIcon,
  TimerIcon,
  TrendIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons/dashboard";
import { ChartFrame } from "@/components/dashboard/ChartFrame";
import { comingSoonProps } from "@/components/dashboard/coming-soon";
import { OrderStatusGrid } from "@/components/dashboard/OrderStatusGrid";
import { DeliveryPeopleGrid, RatedProductList, TopProductGrid } from "@/components/dashboard/ProductWidgets";
import { RangeTabs } from "@/components/dashboard/RangeTabs";
import { SectionCard, ViewAllLink } from "@/components/dashboard/SectionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { PopularStoreGrid, RecentVendorList, TopCustomerList, TopStoreGrid } from "@/components/dashboard/StoreWidgets";
import { Dash, WalletTile } from "@/components/dashboard/WalletTile";
import { requireRole } from "@/lib/auth/guards";
import { getAdminDashboard } from "@/lib/dashboard/admin";
import { formatMoney } from "@/lib/dashboard/format";

export const metadata: Metadata = { title: "Admin dashboard" };

/**
 * Admin dashboard (AdminDashboard mockup). Customer/store counts, vendors by status and the
 * newest registrations come from the DB (loader runs its queries in parallel). Every
 * orders/products/payouts widget keeps its layout and shows an empty state until those
 * models exist (decisions.md, type-B widgets).
 */
export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN"); // layouts don't re-run on client navigation; check here too
  const d = await getAdminDashboard();
  const money = (n: number | undefined) => (d.wallet && n !== undefined ? formatMoney(n) : null);

  return (
    <div className="flex flex-col gap-5.5">
      <div>
        <h1 className="m-0 font-display text-26 leading-110 font-extrabold tracking-heading text-ink">{`Welcome ${user.name ?? "Admin"}`}</h1>
        <p className="mx-0 mt-3 mb-0 text-14 leading-none text-muted">Monitor your business analytics and statistics.</p>
      </div>

      <SectionCard
        title="Business Analytics"
        icon={<TrendIcon size={17} />}
        action={
          <span
            className="flex h-10 cursor-not-allowed items-center gap-2 rounded-md border border-line px-3.5 text-13 leading-none font-medium text-ink-soft"
            {...comingSoonProps}
          >
            This Year Statistics
            <ChevronDownIcon size={14} className="text-muted" />
          </span>
        }
      >
        <div className="mb-3.5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard variant="metric" label="Total Order" value={d.totals.orders} tone="iris" icon={<FileTextIcon size={22} strokeWidth={1.8} />} />
          <StatCard variant="metric" stat="stores" label="Total Stores" value={d.totals.stores} tone="info" icon={<StoreIcon size={22} strokeWidth={1.8} />} />
          <StatCard variant="metric" label="Total Products" value={d.totals.products} tone="success" icon={<BoxIcon size={22} strokeWidth={1.8} />} />
          <StatCard
            variant="metric"
            stat="customers"
            label="Total Customers"
            value={d.totals.customers}
            tone="warning"
            icon={<UsersIcon size={22} strokeWidth={1.8} />}
          />
        </div>
        <OrderStatusGrid counts={d.orderStatusCounts} variant="admin" />
      </SectionCard>

      <SectionCard title="Admin Wallet" icon={<WalletIcon size={17} />}>
        <div className="grid gap-4 lg:grid-cols-[18.75rem_1fr_1fr]">
          <div className="flex flex-col items-center justify-center rounded-xl border border-iris-100 bg-linear-150 from-iris-50 to-iris-25 p-6 text-center">
            <span className="mb-3.5 flex size-14 items-center justify-center rounded-xl bg-surface text-iris-500 shadow-iris">
              <BarChartIcon size={26} strokeWidth={1.8} />
            </span>
            <div className={`font-display text-24 leading-none font-extrabold ${d.wallet ? "text-ink" : "text-muted-soft"}`}>
              {d.wallet ? formatMoney(d.wallet.totalEarning) : <Dash />}
            </div>
            <div className="mt-2 text-13 leading-none text-muted">Total Admin Earning</div>
          </div>
          <div className="flex flex-col gap-4">
            <WalletTile
              align="center"
              icon={<DollarIcon size={22} strokeWidth={1.7} />}
              entries={[{ label: "Commission Earned", value: money(d.wallet?.commissionEarned) }]}
            />
            <WalletTile
              align="center"
              icon={<PercentIcon size={22} strokeWidth={1.7} />}
              entries={[{ label: "Total Tax Collected", value: money(d.wallet?.taxCollected) }]}
            />
          </div>
          <div className="flex flex-col gap-4">
            <WalletTile
              align="center"
              icon={<TruckIcon size={22} strokeWidth={1.7} />}
              entries={[{ label: "Delivery Charge Earned", value: money(d.wallet?.deliveryChargeEarned) }]}
            />
            <WalletTile
              align="center"
              icon={<TimerIcon size={22} strokeWidth={1.7} />}
              entries={[{ label: "Pending Amount", value: money(d.wallet?.pendingAmount) }]}
            />
          </div>
        </div>
      </SectionCard>

      <div className="grid items-start gap-5.5 lg:grid-cols-[1fr_23.75rem]">
        <SectionCard title="Order Statistics" icon={<TrendIcon size={17} />} action={<RangeTabs />}>
          <ChartFrame
            legend={[
              { label: "Inhouse", dot: "iris" },
              { label: "Vendor", dot: "success" },
            ]}
            emptyTitle="No orders yet"
            emptyDescription="Inhouse and vendor orders will be charted here."
          />
        </SectionCard>
        <SectionCard title="User Overview">
          <ChartFrame height="sm" emptyTitle="Chart coming soon" emptyDescription="Account totals are listed below." />
          <UserOverviewLegend overview={d.userOverview} />
        </SectionCard>
      </div>

      <SectionCard title="Earning Statistics" icon={<BarChartIcon size={17} />} action={<RangeTabs />}>
        <ChartFrame
          legend={[
            { label: "Inhouse", dot: "iris" },
            { label: "Vendor", dot: "success" },
            { label: "Commission", dot: "warning" },
          ]}
          emptyTitle="No earnings yet"
          emptyDescription="Inhouse, vendor and commission earnings will be charted here."
        />
      </SectionCard>

      <Group title="Users">
        <SectionCard title="Top Customers" size="plain" icon={<UserIcon size={18} className="text-iris-500" />} action={<ViewAllLink />}>
          <TopCustomerList customers={d.topCustomers} />
        </SectionCard>
        <SectionCard title="Top Delivery Man" size="plain" icon={<TruckIcon size={18} className="text-error-solid" />} action={<ViewAllLink />}>
          <DeliveryPeopleGrid people={d.topDeliveryMen} variant="admin" />
        </SectionCard>
      </Group>

      <Group title="Stores">
        <SectionCard title="Vendors by Status" size="plain" icon={<StoreIcon size={18} className="text-iris-500" />}>
          <div className="grid gap-3">
            <StatCard
              variant="status-compact"
              stat="vendors-pending"
              label="Pending"
              value={d.vendorsByStatus.PENDING}
              tone="warning"
              icon={<ClockIcon size={18} strokeWidth={1.9} />}
            />
            <StatCard
              variant="status-compact"
              stat="vendors-approved"
              label="Approved"
              value={d.vendorsByStatus.APPROVED}
              tone="success"
              valueTone="success"
              icon={<CheckCircleIcon size={18} strokeWidth={1.9} />}
            />
            <StatCard
              variant="status-compact"
              stat="vendors-suspended"
              label="Suspended"
              value={d.vendorsByStatus.SUSPENDED}
              tone="error"
              valueTone="error"
              icon={<BanIcon size={18} strokeWidth={1.9} />}
            />
          </div>
        </SectionCard>
        <SectionCard title="Recent Vendor Registrations" size="plain" icon={<ClockIcon size={18} className="text-iris-500" />} action={<ViewAllLink />}>
          <RecentVendorList vendors={d.recentVendors} />
        </SectionCard>
        <SectionCard
          title="Most Popular Stores"
          size="plain"
          icon={<HeartIcon size={18} fill="currentColor" stroke="none" className="text-error-solid" />}
          action={<ViewAllLink />}
        >
          <PopularStoreGrid stores={d.popularStores} />
        </SectionCard>
        <SectionCard title="Top Selling Stores" size="plain" icon={<ClockIcon size={18} className="text-iris-500" />} action={<ViewAllLink />}>
          <TopStoreGrid stores={d.topSellingStores} />
        </SectionCard>
      </Group>

      <Group title="Inhouse Products">
        <SectionCard title="Most Rated Products" size="plain" icon={<StarIcon size={18} className="text-star" />} action={<ViewAllLink />}>
          <RatedProductList
            products={d.inhouseMostRated}
            variant="admin"
            sellerLabel="Covet Inhouse"
            emptyDescription="Ratings of inhouse products will appear here."
          />
        </SectionCard>
        <SectionCard title="Top Selling Products" size="plain" icon={<DollarIcon size={18} className="text-iris-500" />} action={<ViewAllLink />}>
          <TopProductGrid products={d.inhouseTopSelling} variant="admin" emptyDescription="Best-selling inhouse products will appear here." />
        </SectionCard>
      </Group>

      <Group title="Vendor Products">
        <SectionCard title="Most Rated Products" size="plain" icon={<StarIcon size={18} className="text-star" />} action={<ViewAllLink />}>
          <RatedProductList products={d.vendorMostRated} variant="admin" emptyDescription="Ratings of vendor products will appear here." />
        </SectionCard>
        <SectionCard title="Top Selling Products" size="plain" icon={<DollarIcon size={18} className="text-iris-500" />} action={<ViewAllLink />}>
          <TopProductGrid
            products={d.vendorTopSelling}
            variant="admin"
            showSeller
            emptyDescription="Best-selling vendor products will appear here."
          />
        </SectionCard>
      </Group>
    </div>
  );
}

/** Section title ("Users", "Stores", …) above a two-column row of cards. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-1">
      <h2 className="m-0 mb-4 font-display text-18 leading-none font-bold text-ink">{title}</h2>
      <div className="grid gap-5.5 lg:grid-cols-2">{children}</div>
    </section>
  );
}

function UserOverviewLegend({ overview }: { overview: { customers: number; vendors: number; deliveryMen: number | null } }) {
  const rows = [
    { key: "customers", label: "Total Customer", value: overview.customers, dot: "bg-info-solid" },
    { key: "vendors", label: "Total Vendor", value: overview.vendors, dot: "bg-warning-solid" },
    { key: "deliveryMen", label: "Total Delivery Man", value: overview.deliveryMen, dot: "bg-iris-900" },
  ];
  return (
    <ul className="m-0 mt-5 flex list-none flex-col gap-3 p-0">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center gap-2.5 text-13 leading-none font-medium text-ink-soft">
          <span className={`size-2.5 rounded-full ${r.dot}`} />
          <span>
            {`${r.label} (`}
            {r.value === null ? <Dash /> : <span data-stat={`overview-${r.key}`}>{r.value.toLocaleString("en-US")}</span>}
            {")"}
          </span>
        </li>
      ))}
    </ul>
  );
}
