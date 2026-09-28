import type { Prisma } from "@prisma/client";

const MAX_BASE_LENGTH = 80;

/** "Café Đà Lạt & Co." -> "cafe-da-lat-co". Falls back to "store" when nothing usable is left. */
export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // strip accents left separate by NFKD
    .replace(/[đĐ]/g, "d") // đ has no decomposition
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/, "");
  return slug || "store";
}

/**
 * First free slug among base, base-2, base-3, … Runs inside the registration transaction.
 * A concurrent registration can still take the same slug before commit; the unique index
 * rejects it and the caller retries.
 */
export async function uniqueVendorSlug(tx: Prisma.TransactionClient, base: string): Promise<string> {
  const rows = await tx.vendor.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
