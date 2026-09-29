import type { Metadata } from "next";
import { ChevronDownIcon, UserIcon } from "@/components/icons";
import {
  BarChartIcon,
  CashIcon,
  CoinsIcon,
  DollarIcon,
  StarIcon,
  TagIcon,
  TimerIcon,
  TrendIcon,
  WalletIcon,
} from "@/components/icons/dashboard";
import { ChartFrame } from "@/components/dashboard/ChartFrame";
import { comingSoonProps } from "@/components/dashboard/coming-soon";
import { OrderStatusGrid } from "@/components/dashboard/OrderStatusGrid";
import { DeliveryPeopleGrid, RatedProductList, TopProductGrid } from "@/components/dashboard/ProductWidgets";
import { RangeTabs } from "@/components/dashboard/RangeTabs";
import { SectionCard, ViewAllLink } from "@/components/dashboard/SectionCard";
import { Dash, WalletTile } from "@/components/dashboard/WalletTile";
import { StatusBadge } from "@/components/StatusBadge";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { formatDate, formatMoney } from "@/lib/dashboard/format";
import { getVendorDashboard } from "@/lib/dashboard/vendor";

export const metadata: Metadata = { title: "Seller dashboard" };

/**
 * Seller dashboard (vendordashboard mockup). Store and owner come from the DB; every
 * orders/products/payouts widget keeps its layout and shows an empty state until those
 * models exist (decisions.md, type-B widgets).
 */
export default async function VendorDashboardPage() {
  const { user } = await requireApprovedVendor(); // layouts don't re-run on client navigation; check here too
  const { owner, store, orderStatusCounts, wallet, mostRatedProducts, topSellingProducts, topDeliveryMen } =
    await getVendorDashboard(user.id);
  const money = (n: number | undefined) => (wallet && n !== undefined ? formatMoney(n) : null);

  return (
    <div className="flex flex-col gap-5.5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 font-display text-26 leading-110 font-extrabold tracking-heading text-ink">{`Welcome ${owner.name}`}</h1>
          <p className="mx-0 mt-3 mb-0 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-14 leading-none text-muted">
            <span className="font-semibold text-ink-soft">{store.storeName}</span>
            <span aria-hidden="true">·</span>
            <span>{`/${store.slug}`}</span>
            <span aria-hidden="true">·</span>
            <StatusBadge status={store.status} />
            <span aria-hidden="true">·</span>
            <span>{`Since ${formatDate(store.createdAt)}`}</span>
          </p>
        </div>
        <span
          role="button"
          className="flex h-11 cursor-not-allowed items-center gap-2 rounded-md bg-iris-500 px-5 font-display text-13 leading-none font-bold text-white opacity-60"
          {...comingSoonProps}
        >
          <TagIcon size={17} />
          Products
        </span>
      </div>

      <SectionCard
        title="Business Analytics"
        icon={<TrendIcon size={17} />}
        action={
          <span
            className="flex h-10 cursor-not-allowed items-center gap-2 rounded-md border border-line px-3.5 text-13 leading-none font-medium text-ink-soft"
            {...comingSoonProps}
          >
            Overall Statistics
            <ChevronDownIcon size={14} className="text-muted" />
          </span>
        }
      >
        <OrderStatusGrid counts={orderStatusCounts} variant="seller" />
      </SectionCard>

      <SectionCard title="Vendor Wallet" icon={<WalletIcon size={17} />}>
        <div className="grid gap-4 lg:grid-cols-[18.75rem_1fr_1fr]">
          <div className="flex flex-col items-center rounded-xl border border-iris-100 bg-linear-150 from-iris-50 to-iris-25 p-6 text-center">
            <span className="mb-3.5 flex size-14 items-center justify-center rounded-xl bg-surface text-iris-500 shadow-iris">
              <CashIcon dots size={26} strokeWidth={1.8} />
            </span>
            <div className={`font-display text-28 leading-none font-extrabold ${wallet ? "text-ink" : "text-muted-soft"}`}>
              {wallet ? formatMoney(wallet.withdrawableBalance) : <Dash />}
            </div>
            <div className="mt-2 mb-4 text-13 leading-none text-muted">Withdrawable Balance</div>
            <span
              role="button"
              className="flex h-11 w-full cursor-not-allowed items-center justify-center rounded-md bg-iris-500 font-display text-13 leading-none font-bold text-white opacity-60"
              {...comingSoonProps}
            >
              Withdraw
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <WalletTile
              icon={<TimerIcon size={22} strokeWidth={1.7} />}
              entries={[{ label: "Pending Withdraw", value: money(wallet?.pendingWithdraw) }]}
            />
            <WalletTile
              icon={<CoinsIcon size={22} strokeWidth={1.7} />}
              entries={[
                { label: "Already Withdrawn", value: money(wallet?.alreadyWithdrawn) },
                { label: "Total Tax", value: money(wallet?.totalTax) },
              ]}
            />
          </div>
          <div className="flex flex-col gap-4">
            <WalletTile
              icon={<DollarIcon size={22} strokeWidth={1.7} />}
              entries={[{ label: "Total Commission", value: money(wallet?.totalCommission) }]}
            />
            <WalletTile
              icon={<CashIcon size={22} strokeWidth={1.7} />}
              entries={[
                { label: "Total Delivery Charge Earned", value: money(wallet?.deliveryChargeEarned) },
                { label: "Collected Cash", value: money(wallet?.collectedCash) },
              ]}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Earning Statistics" icon={<BarChartIcon size={17} />} action={<RangeTabs />}>
        <ChartFrame
          legend={[
            { label: "Income", dot: "iris" },
            { label: "Commission given", dot: "success" },
          ]}
          emptyTitle="No earnings yet"
          emptyDescription="Income and commission will be charted here once you start selling."
        />
      </SectionCard>

      <div className="grid gap-5.5 lg:grid-cols-[1fr_1.3fr]">
        <SectionCard title="Most Rated Products" size="md" tone="amber" icon={<StarIcon size={16} />} action={<ViewAllLink />}>
          <RatedProductList
            products={mostRatedProducts}
            variant="seller"
            emptyDescription="Ratings appear here once customers review your products."
          />
        </SectionCard>
        <SectionCard title="Top Selling Products" size="md" icon={<DollarIcon size={16} />} action={<ViewAllLink />}>
          <TopProductGrid
            products={topSellingProducts}
            variant="seller"
            emptyDescription="Your best-selling products will appear here."
          />
        </SectionCard>
      </div>

      <SectionCard title="Top Delivery Man" size="md" tone="danger" icon={<UserIcon size={16} />} action={<ViewAllLink />}>
        <DeliveryPeopleGrid people={topDeliveryMen} variant="seller" />
      </SectionCard>
    </div>
  );
}
