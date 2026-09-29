// Brand writes. Pure logic: takes input already validated by the Zod schemas and never looks
// at the session (server actions check ADMIN first). Kept apart from the actions so
// scripts/verify-brands.ts can call it directly.
//
// File <-> DB consistency:
// - create: save file -> create row; create fails -> delete the new file
// - update with a new image: save new file -> update row -> delete old file;
//   update fails -> delete the new file, keep the old one
// - delete: delete row -> delete file (a failed file delete is only logged)

import { Prisma, type BrandStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { brandSelect, countProductsByBrand, type BrandRecord } from "@/lib/brands/queries";
import {
  BRAND_IMAGE_MAX_BYTES,
  IMAGE_BAD_TYPE,
  IMAGE_TOO_LARGE,
  type BrandField,
  type CreateBrandInput,
  type UpdateBrandInput,
} from "@/lib/brands/schema";
import { deleteImage, ImageValidationError, saveImage } from "@/lib/storage/images";

export const BRAND_NAME_TAKEN = "A brand with this name already exists";
export const BRAND_NOT_FOUND = "This brand no longer exists";

export type BrandServiceResult<T> = { ok: true; data: T } | { ok: false; error: string; field?: BrandField };

const SLUG_RETRIES = 3;
/** Leaves room for a "-N" suffix inside the VarChar(80) column. */
const SLUG_BASE_MAX = 72;

const nameTakenResult = { ok: false, error: BRAND_NAME_TAKEN, field: "name" } as const;
const notFoundResult = { ok: false, error: BRAND_NOT_FOUND } as const;

/** Unique-constraint violation (P2002) on an index covering `field` (MySQL reports "Brand_name_key"). */
function isUniqueViolation(err: unknown, field: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  const target = err.meta?.target;
  const text = Array.isArray(target) ? target.join(",") : String(target ?? "");
  return text.includes(field);
}

/** Record to update/delete was not found (P2025). */
function isNotFound(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";
}

/**
 * Slug base from the name. slugify() falls back to "store" when no a-z/0-9 is left (it was
 * written for vendors); brands fall back to "brand" instead. NFKD exposes the base letter of
 * accented characters; "đ" has no decomposition, slugify maps it to "d".
 */
function brandBaseSlug(name: string): string {
  if (!/[a-z0-9đ]/i.test(name.normalize("NFKD"))) return "brand";
  return slugify(name).slice(0, SLUG_BASE_MAX).replace(/-+$/, "");
}

/** First free slug among base, base-2, base-3, … The unique index still guards races (retry). */
async function uniqueBrandSlug(base: string): Promise<string> {
  const rows = await prisma.brand.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Another brand already uses this name (compared by the column collation: case and accents ignored). */
async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  const other = await prisma.brand.findFirst({
    where: { name, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  return other !== null;
}

/** Saves the upload, or returns a field error for a bad file. */
async function storeBrandImage(file: File): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    const path = await saveImage("brands", file, {
      maxBytes: BRAND_IMAGE_MAX_BYTES,
      tooLargeMessage: IMAGE_TOO_LARGE,
      badTypeMessage: IMAGE_BAD_TYPE,
    });
    return { ok: true, path };
  } catch (err) {
    if (err instanceof ImageValidationError) return { ok: false, error: err.message };
    throw err;
  }
}

/** Cleanup never fails the operation: a leftover file is only logged. */
async function deleteImageQuietly(path: string): Promise<void> {
  try {
    await deleteImage(path);
  } catch (err) {
    console.error(`[brands] could not delete image ${path}`, err);
  }
}

export async function createBrand(input: CreateBrandInput): Promise<BrandServiceResult<BrandRecord>> {
  // Checked before saving the file so a duplicate name does not write (and then delete) a file.
  // The unique index still decides races.
  if (await nameTaken(input.name)) return nameTakenResult;

  const stored = await storeBrandImage(input.image);
  if (!stored.ok) return { ok: false, error: stored.error, field: "image" };

  const base = brandBaseSlug(input.name);
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        const brand = await prisma.brand.create({
          data: { name: input.name, slug: await uniqueBrandSlug(base), image: stored.path, status: input.status },
          select: brandSelect,
        });
        return { ok: true, data: brand };
      } catch (err) {
        // Another brand took the same slug between our lookup and the insert: pick again.
        if (isUniqueViolation(err, "slug") && attempt < SLUG_RETRIES) continue;
        throw err;
      }
    }
  } catch (err) {
    await deleteImageQuietly(stored.path);
    if (isUniqueViolation(err, "name")) return nameTakenResult;
    throw err;
  }
}

/** Updates name/status and, if a new image is given, replaces the image. The slug never changes. */
export async function updateBrand(id: string, input: UpdateBrandInput): Promise<BrandServiceResult<BrandRecord>> {
  const exists = await prisma.brand.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return notFoundResult;
  if (await nameTaken(input.name, id)) return nameTakenResult;

  let newImage: string | null = null;
  if (input.image) {
    const stored = await storeBrandImage(input.image);
    if (!stored.ok) return { ok: false, error: stored.error, field: "image" };
    newImage = stored.path;
  }

  let updated: { brand: BrandRecord; oldImage: string | null } | null;
  try {
    updated = await prisma.$transaction(async (tx) => {
      // Lock the row so two concurrent image replacements cannot both read the same old file
      // (which would leave one new file orphaned).
      const rows = await tx.$queryRaw<{ image: string | null }[]>`SELECT image FROM Brand WHERE id = ${id} FOR UPDATE`;
      if (rows.length === 0) return null;
      const brand = await tx.brand.update({
        where: { id },
        data: { name: input.name, status: input.status, ...(newImage ? { image: newImage } : {}) },
        select: brandSelect,
      });
      return { brand, oldImage: rows[0].image };
    });
  } catch (err) {
    if (newImage) await deleteImageQuietly(newImage);
    if (isUniqueViolation(err, "name")) return nameTakenResult;
    if (isNotFound(err)) return notFoundResult;
    throw err;
  }

  if (!updated) {
    if (newImage) await deleteImageQuietly(newImage);
    return notFoundResult;
  }
  if (newImage && updated.oldImage && updated.oldImage !== newImage) await deleteImageQuietly(updated.oldImage);
  return { ok: true, data: updated.brand };
}

/** Refuses while the brand still has products (suggests deactivating instead). */
export async function deleteBrand(id: string): Promise<BrandServiceResult<{ id: string; name: string }>> {
  const productCount = await countProductsByBrand(id);
  if (productCount > 0) {
    const noun = productCount === 1 ? "product" : "products";
    return {
      ok: false,
      error: `This brand still has ${productCount} ${noun}, so it can't be deleted. Set it to Inactive instead.`,
    };
  }

  let deleted: { id: string; name: string; image: string | null };
  try {
    deleted = await prisma.brand.delete({ where: { id }, select: { id: true, name: true, image: true } });
  } catch (err) {
    if (isNotFound(err)) return notFoundResult;
    throw err;
  }
  if (deleted.image) await deleteImageQuietly(deleted.image);
  return { ok: true, data: { id: deleted.id, name: deleted.name } };
}

export async function setBrandStatus(
  id: string,
  status: BrandStatus,
): Promise<BrandServiceResult<{ id: string; status: BrandStatus }>> {
  try {
    const brand = await prisma.brand.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    return { ok: true, data: brand };
  } catch (err) {
    if (isNotFound(err)) return notFoundResult;
    throw err;
  }
}
