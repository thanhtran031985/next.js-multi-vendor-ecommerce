// Product / delivery widgets shared by the seller and admin dashboards. Each renders the
// loader's rows when there are any and an empty state otherwise, so a later task only has
// to fill the loader. `variant` follows the two mockups' small styling differences.

import { CartIcon, UserIcon } from "@/components/icons";
import { StarIcon } from "@/components/icons/dashboard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatMoney } from "@/lib/dashboard/format";
import type { DeliveryPerson, RatedProduct, TopProduct } from "@/lib/dashboard/types";

type Variant = "seller" | "admin";

function ImagePlaceholder({ className }: { className: string }) {
  return <div className={`placeholder-hatch flex-none bg-field ${className}`} aria-hidden="true" />;
}

export function RatedProductList({
  products,
  variant,
  sellerLabel,
  emptyDescription,
}: {
  products: RatedProduct[];
  variant: Variant;
  /** Admin "Inhouse Products" shows a fixed seller name instead of each product's store. */
  sellerLabel?: string;
  emptyDescription: string;
}) {
  if (products.length === 0) {
    return <EmptyState icon={<StarIcon size={22} />} title="No rated products yet" description={emptyDescription} />;
  }
  const admin = variant === "admin";
  return (
    <ul className={`m-0 flex list-none flex-col p-0 ${admin ? "gap-3" : "gap-2.5"}`}>
      {products.map((p) => (
        <li key={p.id} className="flex items-center gap-3.5 rounded-lg border border-line-soft p-3 hover:bg-bg-subtle">
          <ImagePlaceholder className={admin ? "size-13 rounded-control" : "size-14 rounded-control"} />
          <div className="min-w-0 flex-1">
            <div className={`leading-130 font-semibold text-ink ${admin ? "text-13-5" : "text-14"}`}>{p.title}</div>
            <div className="mt-1.5 text-11 leading-none text-iris-500">
              {admin ? `Sold by ${sellerLabel ?? p.storeName}` : `by ${p.storeName}`}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <StarIcon size={admin ? 13 : 14} className="text-star" />
              <span className="font-display text-12-5 leading-none font-bold text-ink">{p.rating}</span>
              <span className="text-12 leading-none text-muted-soft">
                {admin ? `(${p.reviewCount} Reviews)` : `${p.reviewCount} Reviews`}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TopProductGrid({
  products,
  variant,
  showSeller = false,
  emptyDescription,
}: {
  products: TopProduct[];
  variant: Variant;
  showSeller?: boolean;
  emptyDescription: string;
}) {
  if (products.length === 0) {
    return <EmptyState icon={<CartIcon size={22} />} title="No sales yet" description={emptyDescription} />;
  }
  const admin = variant === "admin";
  return (
    <ul className={`m-0 grid list-none gap-3.5 p-0 ${admin ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {products.map((p) => (
        <li
          key={p.id}
          className={`rounded-lg border border-line-soft text-center transition-shadow duration-200 hover:shadow-card-hover ${
            admin ? "p-3.5" : "p-3"
          }`}
        >
          <ImagePlaceholder className="mb-2.5 aspect-square w-full rounded-md" />
          <div className="min-h-8 text-12-5 leading-130 font-semibold text-ink">{p.title}</div>
          {showSeller && <div className="mt-1.5 text-10 leading-none text-iris-500">{p.storeName}</div>}
          <div className="mt-2 mb-1 text-11 leading-none text-muted-soft">Total Sold Price</div>
          <div className="mb-2.5 font-display text-14 leading-none font-bold text-ink">{formatMoney(p.soldTotal)}</div>
          {admin ? (
            <span className="inline-flex items-center rounded-full bg-iris-50 px-3 py-1.25 text-11 leading-none font-semibold text-accent-fg">
              {`Sold : ${p.soldCount}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-iris-500 px-3 py-1.5 text-11 leading-none font-semibold text-white">
              {`Sold: ${p.soldCount}`}
              <CartIcon size={13} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function DeliveryPeopleGrid({ people, variant }: { people: DeliveryPerson[]; variant: Variant }) {
  if (people.length === 0) {
    return (
      <EmptyState
        icon={<UserIcon size={22} />}
        title="No deliveries yet"
        description="Delivery partners will appear here once orders start shipping."
      />
    );
  }
  const admin = variant === "admin";
  return (
    <ul className={`m-0 grid list-none gap-4 p-0 ${admin ? "grid-cols-2" : "grid-cols-[repeat(auto-fill,minmax(13.75rem,1fr))]"}`}>
      {people.map((d) => (
        <li
          key={d.id}
          className={`border border-line-soft text-center hover:shadow-card-hover ${admin ? "rounded-lg p-5" : "rounded-xl p-5.5"}`}
        >
          <div
            className={`mx-auto flex items-center justify-center rounded-full bg-linear-135 from-iris-100 to-iris-50 text-iris-400 ${
              admin ? "mb-3 size-15" : "mb-3.5 size-17.5"
            }`}
          >
            <UserIcon size={admin ? 28 : 32} strokeWidth={1.7} />
          </div>
          <div className="font-display text-14 leading-none font-bold text-ink">{d.name}</div>
          <div className="mt-2.5 flex items-center justify-center gap-1.25 text-12 leading-none text-muted">
            {admin ? "Rating :" : "Rating:"} <span className="font-semibold text-ink">{d.rating}</span>
            <StarIcon size={12} className="text-star" />
          </div>
          <div className="mt-2 text-12 leading-none text-muted">
            {admin ? "Order Delivered :" : "Orders Delivered:"} <span className="font-semibold text-ink">{d.deliveredCount}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
