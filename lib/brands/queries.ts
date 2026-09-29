// Brand reads, called directly from server components (not server actions: those are for
// writes) and from scripts/verify-brands.ts. No "server-only" import so the script can load
// it; client components must not import this file (it uses Prisma).

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { BrandListParams } from "@/lib/brands/schema";

export const brandSelect = {
  id: true,
  name: true,
  slug: true,
  image: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BrandSelect;

export type BrandRecord = Prisma.BrandGetPayload<{ select: typeof brandSelect }>;
export type BrandListItem = BrandRecord & { productCount: number };

export type BrandListResult = {
  items: BrandListItem[];
  /** Brands matching the filters. */
  total: number;
  /** All brands, ignoring filters: tells "no brands yet" apart from "no match". */
  totalAll: number;
  /** Page actually shown: the requested one, clamped to the last page. */
  page: number;
  pageSize: number;
  pageCount: number;
};

/**
 * Number of products of a brand. The Product model does not exist yet, so this is always 0.
 * Every place that needs the count (list column, detail stats, delete guard) calls this, so
 * the Product task only changes this function.
 */
export async function countProductsByBrand(
  brandId: string,
  status?: "active" | "inactive",
): Promise<number> {
  // TODO(product task): dùng _count
  void brandId;
  void status;
  return 0;
}

/** Search (name contains q; the column collation ignores case and accents), filter, paginate. */
export async function listBrands(params: BrandListParams): Promise<BrandListResult> {
  const where: Prisma.BrandWhereInput = {
    ...(params.q ? { name: { contains: params.q } } : {}),
    ...(params.status ? { status: params.status } : {}),
  };

  const { rows, total, totalAll, page, pageCount } = await prisma.$transaction(async (tx) => {
    const total = await tx.brand.count({ where });
    const totalAll = await tx.brand.count();
    const pageCount = Math.max(1, Math.ceil(total / params.pageSize));
    const page = Math.min(params.page, pageCount);
    const rows = await tx.brand.findMany({
      where,
      select: brandSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * params.pageSize,
      take: params.pageSize,
    });
    return { rows, total, totalAll, page, pageCount };
  });

  const items = await Promise.all(
    rows.map(async (row) => ({ ...row, productCount: await countProductsByBrand(row.id) })),
  );
  return { items, total, totalAll, page, pageSize: params.pageSize, pageCount };
}

export async function getBrandById(id: string): Promise<BrandRecord | null> {
  return prisma.brand.findUnique({ where: { id }, select: brandSelect });
}
