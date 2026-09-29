// Admin dashboard widgets for people and stores (AdminDashboard mockup "Users" / "Stores"
// sections, plus the vendor widgets of decisions.md Q3). Each renders the loader's rows,
// or an empty state when there are none.

import { CartIcon, HeartIcon, UserIcon } from "@/components/icons";
import { StoreIcon } from "@/components/icons/dashboard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ListRow } from "@/components/dashboard/ListRow";
import { StatusBadge } from "@/components/StatusBadge";
import type { RecentVendor } from "@/lib/dashboard/admin";
import { formatDate, formatMoney } from "@/lib/dashboard/format";
import type { StoreLikes, StoreSales, TopCustomer } from "@/lib/dashboard/types";

function StoreAvatar({ round = false }: { round?: boolean }) {
  return (
    <span
      className={`flex size-11 flex-none items-center justify-center bg-linear-135 from-iris-100 to-iris-50 text-iris-500 ${
        round ? "rounded-full" : "rounded-control"
      }`}
    >
      <StoreIcon size={22} strokeWidth={1.7} />
    </span>
  );
}

export function TopCustomerList({ customers }: { customers: TopCustomer[] }) {
  if (customers.length === 0) {
    return (
      <EmptyState
        icon={<UserIcon size={22} />}
        title="No orders yet"
        description="Customers will be ranked here by the number of orders they place."
      />
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {customers.map((c) => (
        <li key={c.id}>
          <ListRow
            leading={
              <span className="flex size-11 flex-none items-center justify-center rounded-full bg-linear-135 from-iris-100 to-iris-50 text-iris-400">
                <UserIcon size={22} strokeWidth={1.8} />
              </span>
            }
            title={c.name}
            subtitle={c.email}
            trailing={
              <span className="inline-flex items-center rounded-full bg-iris-50 px-3 py-1.5 text-11 leading-none font-semibold whitespace-nowrap text-accent-fg">
                {`Orders : ${c.orderCount}`}
              </span>
            }
          />
        </li>
      ))}
    </ul>
  );
}

/** Five newest store registrations (decisions.md Q3). View only: approving is a later task. */
export function RecentVendorList({ vendors }: { vendors: RecentVendor[] }) {
  if (vendors.length === 0) {
    return (
      <EmptyState
        icon={<StoreIcon size={22} />}
        title="No vendors yet"
        description="New store registrations will appear here."
      />
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0" data-list="recent-vendors">
      {vendors.map((v) => (
        <li key={v.id} data-store={v.storeName}>
          <ListRow
            leading={<StoreAvatar round />}
            title={v.storeName}
            subtitle={v.ownerEmail}
            trailing={
              <span className="flex flex-none flex-col items-end gap-1.5">
                <StatusBadge status={v.status} />
                <span className="text-11 leading-none whitespace-nowrap text-muted-soft">{formatDate(v.createdAt)}</span>
              </span>
            }
          />
        </li>
      ))}
    </ul>
  );
}

export function PopularStoreGrid({ stores }: { stores: StoreLikes[] }) {
  if (stores.length === 0) {
    return (
      <EmptyState
        icon={<HeartIcon size={22} />}
        title="No store likes yet"
        description="Stores customers like the most will appear here."
      />
    );
  }
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3.5 p-0">
      {stores.map((s) => (
        <li key={s.id} className="flex items-center gap-3 rounded-lg border border-line-soft p-3.5 hover:bg-bg-subtle">
          <StoreAvatar />
          <div className="min-w-0">
            <div className="truncate text-13-5 leading-120 font-semibold text-ink">{s.storeName}</div>
            <div className="mt-1.5 flex items-center gap-1 text-12 leading-none text-muted">
              <HeartIcon size={12} fill="currentColor" stroke="none" className="text-error-solid" />
              {s.likes}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TopStoreGrid({ stores }: { stores: StoreSales[] }) {
  if (stores.length === 0) {
    return (
      <EmptyState
        icon={<CartIcon size={22} />}
        title="No store sales yet"
        description="Stores with the highest sales will appear here."
      />
    );
  }
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3.5 p-0">
      {stores.map((s) => (
        <li key={s.id} className="flex items-center gap-3 rounded-lg border border-line-soft p-3.5 hover:bg-bg-subtle">
          <StoreAvatar />
          <div className="min-w-0">
            <div className="truncate text-13-5 leading-120 font-semibold text-ink">{s.storeName}</div>
            <div className="mt-1.5 flex items-center gap-1.25 font-display text-12-5 leading-none font-bold text-iris-500">
              <CartIcon size={13} />
              {formatMoney(s.salesTotal)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
