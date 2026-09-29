import Image from "next/image";
import Link from "next/link";
import { EyeIcon } from "@/components/icons";
import { DeleteBrandButton } from "@/components/brands/DeleteBrandButton";
import { EditBrandButton } from "@/components/brands/BrandFormTriggers";
import { BrandStatusToggle } from "@/components/brands/BrandStatusToggle";
import { rowActionClass } from "@/components/brands/styles";
import { brandDetailHref } from "@/lib/brands/list-url";
import type { BrandListItem } from "@/lib/brands/queries";

// VendorProductList / AdminProductList mockup columns: # / image / name / slug / products /
// status / actions, 14px apart, 18px side padding. A real <table> (fixed layout) keeps table
// semantics for screen readers; it scrolls sideways below 60rem instead of squeezing.
const CELL = "py-3.5 pr-3.5 align-middle first:pl-4.5 last:pr-4.5";

/** Brand rows. `startIndex` = rows before this page, for the # column. */
export function BrandTable({ items, startIndex }: { items: BrandListItem[]; startIndex: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line-soft">
      <table className="w-full min-w-240 table-fixed border-collapse">
        <colgroup>
          <col className="w-16" />
          <col className="w-17.5" />
          <col />
          <col />
          <col className="w-28.5" />
          <col className="w-41" />
          <col className="w-34.5" />
        </colgroup>
        <thead>
          <tr className="bg-field text-left text-11 leading-none font-semibold tracking-table text-muted uppercase">
            <th scope="col" className={`${CELL} font-semibold`}>#</th>
            <th scope="col" className={`${CELL} font-semibold`}>Image</th>
            <th scope="col" className={`${CELL} font-semibold`}>Brand Name</th>
            <th scope="col" className={`${CELL} font-semibold`}>Slug</th>
            <th scope="col" className={`${CELL} font-semibold`}>Products</th>
            <th scope="col" className={`${CELL} font-semibold`}>Status</th>
            <th scope="col" className={`${CELL} text-right font-semibold`}>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((brand, i) => (
            <tr key={brand.id} className="border-t border-field transition-colors hover:bg-bg-subtle">
              <td className={`${CELL} text-13 leading-none font-medium text-muted`}>{startIndex + i + 1}</td>
              <td className={CELL}>
                <BrandThumb image={brand.image} />
              </td>
              <td className={CELL}>
                <Link
                  href={brandDetailHref(brand.id)}
                  title={brand.name}
                  className="block truncate text-13-5 leading-130 font-semibold text-ink hover:text-iris-500"
                >
                  {brand.name}
                </Link>
              </td>
              <td className={`${CELL} truncate text-13 leading-none text-ink-soft`} title={brand.slug}>
                {brand.slug}
              </td>
              <td className={`${CELL} text-13 leading-none text-ink-soft`}>{brand.productCount}</td>
              <td className={CELL}>
                <BrandStatusToggle id={brand.id} name={brand.name} status={brand.status} />
              </td>
              <td className={CELL}>
                <div className="flex justify-end gap-1.75">
                  <Link
                    href={brandDetailHref(brand.id)}
                    aria-label={`View ${brand.name}`}
                    title="View"
                    className={`${rowActionClass.base} ${rowActionClass.view}`}
                  >
                    <EyeIcon size={15} />
                  </Link>
                  <EditBrandButton
                    brand={{ id: brand.id, name: brand.name, image: brand.image, status: brand.status }}
                  />
                  <DeleteBrandButton
                    brand={{ id: brand.id, name: brand.name, status: brand.status, productCount: brand.productCount }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 46px thumbnail; hatched placeholder when the brand has no image. */
export function BrandThumb({ image, size = "row" }: { image: string | null; size?: "row" | "lg" }) {
  const box = size === "row" ? "size-11.5 rounded-md" : "size-24 rounded-lg";
  return (
    <div className={`relative flex-none overflow-hidden bg-field ${box}`}>
      {image ? (
        <Image src={image} alt="" fill sizes={size === "row" ? "46px" : "96px"} className="object-cover" />
      ) : (
        <div className="placeholder-hatch absolute inset-0" />
      )}
    </div>
  );
}
