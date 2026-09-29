import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditBrandButton } from "@/components/brands/BrandFormTriggers";
import { BrandStatusBadge } from "@/components/brands/BrandStatusBadge";
import { BrandThumb } from "@/components/brands/BrandTable";
import { DeleteBrandButton } from "@/components/brands/DeleteBrandButton";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { BoxIcon } from "@/components/icons/dashboard";
import { requireRole } from "@/lib/auth/guards";
import { countProductsByBrand, getBrandById } from "@/lib/brands/queries";

type BrandDetailProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: BrandDetailProps): Promise<Metadata> {
  const brand = await getBrandById((await params).id);
  return { title: brand?.name ?? "Brand" };
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

/**
 * /admin/brands/[id]: header card, product stats and the (still empty) product table.
 * All product numbers come from countProductsByBrand, which is 0 until the Product task.
 */
export default async function BrandDetailPage({ params }: BrandDetailProps) {
  await requireRole("ADMIN");
  const { id } = await params;
  const brand = await getBrandById(id);
  if (!brand) notFound();

  const [total, active, inactive] = await Promise.all([
    countProductsByBrand(brand.id),
    countProductsByBrand(brand.id, "active"),
    countProductsByBrand(brand.id, "inactive"),
  ]);
  const stats = [
    { label: "Total products", value: total },
    { label: "On sale", value: active },
    { label: "Not on sale", value: inactive },
  ];

  return (
    <div className="flex flex-col gap-5">
      <section
        className="flex flex-wrap items-center gap-5 rounded-xl border border-line-soft bg-surface px-6 py-5.5 shadow-xs"
        aria-label="Brand overview"
      >
        <BrandThumb image={brand.image} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 min-w-0 truncate font-display text-24 leading-none font-extrabold tracking-heading text-ink">
              {brand.name}
            </h1>
            <BrandStatusBadge status={brand.status} />
          </div>
          <dl className="m-0 mt-3 flex flex-wrap gap-x-8 gap-y-2 text-13 leading-none text-muted">
            <div className="flex gap-2">
              <dt>Slug</dt>
              <dd className="m-0 font-medium text-ink-soft">{brand.slug}</dd>
            </div>
            <div className="flex gap-2">
              <dt>Created</dt>
              <dd className="m-0 font-medium text-ink-soft">
                <time dateTime={brand.createdAt.toISOString()}>{dateFormat.format(brand.createdAt)}</time>
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex gap-2.5">
          <EditBrandButton
            variant="button"
            brand={{ id: brand.id, name: brand.name, image: brand.image, status: brand.status }}
          />
          <DeleteBrandButton
            variant="button"
            redirectToList
            brand={{ id: brand.id, name: brand.name, status: brand.status, productCount: total }}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Product statistics">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line-soft bg-surface px-6 py-5 shadow-xs">
            <div className="text-13 leading-none text-muted">{stat.label}</div>
            <div className="mt-3 font-display text-24 leading-none font-extrabold text-ink">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-line-soft bg-surface px-6 py-5.5 shadow-xs" aria-label="Products">
        <h2 className="m-0 font-display text-16 leading-none font-bold text-ink">Products</h2>
        <EmptyState
          variant="page"
          framed={false}
          icon={<BoxIcon size={36} strokeWidth={1.6} />}
          title="No products yet"
          description="Products assigned to this brand will be listed here."
        />
      </section>
    </div>
  );
}
