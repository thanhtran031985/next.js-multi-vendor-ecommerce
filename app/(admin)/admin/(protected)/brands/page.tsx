import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/icons";
import { TagIcon } from "@/components/icons/dashboard";
import { BrandTable } from "@/components/brands/BrandTable";
import { BrandToolbar } from "@/components/brands/BrandToolbar";
import { comingSoonProps } from "@/components/dashboard/coming-soon";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { requireRole } from "@/lib/auth/guards";
import { brandListHref } from "@/lib/brands/list-url";
import { listBrands } from "@/lib/brands/queries";
import { parseBrandListParams } from "@/lib/brands/schema";

export const metadata: Metadata = { title: "Brands" };

type BrandsPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * /admin/brands (VendorProductList mockup inside the admin shell). The URL is the only list
 * state (q, status, page, pageSize); invalid values fall back to defaults and a page past the
 * end shows the last page. Four states: loading.tsx, error.tsx, no brands yet, no match.
 */
export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  await requireRole("ADMIN"); // layouts don't re-run on client navigation; check here too
  const params = parseBrandListParams(await searchParams);
  const list = await listBrands(params);
  const hrefFor = (page: number) =>
    brandListHref({ q: params.q, status: params.status, pageSize: list.pageSize, page });

  return (
    <div>
      <div className="mb-5.5 flex items-center gap-3">
        <span className="flex size-9 flex-none items-center justify-center rounded-md bg-iris-50 text-iris-500">
          <TagIcon size={20} strokeWidth={1.9} />
        </span>
        <h1 className="m-0 font-display text-24 leading-none font-extrabold tracking-heading text-ink">Brands</h1>
        <span
          className="flex h-6.5 min-w-7.5 items-center justify-center rounded-full bg-track px-2.5 font-display text-13 leading-none font-bold text-ink-soft"
          aria-label={`${list.totalAll} brands in total`}
        >
          {list.totalAll}
        </span>
      </div>

      <section className="rounded-xl border border-line-soft bg-surface px-6 py-5.5 shadow-xs" aria-label="Brand list">
        <BrandToolbar q={params.q} status={params.status} pageSize={list.pageSize} action={<AddBrandButton />} />

        {list.totalAll === 0 ? (
          <EmptyState
            variant="page"
            framed={false}
            icon={<TagIcon size={36} strokeWidth={1.6} />}
            title="No brands yet"
            description="Add your first brand so products can be grouped by who makes them."
            action={<AddBrandButton size="lg" />}
          />
        ) : list.total === 0 ? (
          <EmptyState
            variant="page"
            framed={false}
            icon={<TagIcon size={36} strokeWidth={1.6} />}
            title="No brands match your filters"
            description="Try a different name or status, or clear the filters to see every brand."
            action={
              <Link
                href={brandListHref({ pageSize: list.pageSize })}
                className="inline-flex h-11.5 items-center rounded-control border border-line bg-surface px-6 text-13-5 leading-none font-semibold text-ink-soft transition-colors hover:bg-field hover:text-ink-soft focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none"
              >
                Clear filters
              </Link>
            }
          />
        ) : (
          <>
            <BrandTable items={list.items} startIndex={(list.page - 1) * list.pageSize} />
            <Pagination page={list.page} pageCount={list.pageCount} hrefFor={hrefFor} label="Brand list pages" />
          </>
        )}
      </section>
    </div>
  );
}

/** Opens the add-brand dialog: wired up in step 6. */
function AddBrandButton({ size = "md" }: { size?: "md" | "lg" }) {
  const shape =
    size === "md"
      ? "h-11.5 rounded-md px-5 font-display text-13 font-bold"
      : "h-11.5 rounded-control px-6 text-13-5 font-semibold";
  return (
    <span
      role="button"
      className={`flex cursor-not-allowed items-center gap-2 bg-iris-500 leading-none whitespace-nowrap text-white opacity-60 ${shape}`}
      {...comingSoonProps}
    >
      <PlusIcon size={17} />
      Add Brand
    </span>
  );
}
