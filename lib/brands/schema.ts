// Zod schemas for brands, shared by the admin forms (client) and the server actions.
// No Prisma import: client components use this file too.

import { z } from "zod";

export const BRAND_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type BrandStatusValue = (typeof BRAND_STATUSES)[number];

export const BRAND_NAME_MIN = 2;
export const BRAND_NAME_MAX = 60;

/** Max upload size. The server re-checks the real byte count and magic bytes (lib/storage/images.ts). */
export const BRAND_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const BRAND_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** For the file input's `accept` attribute. */
export const BRAND_IMAGE_ACCEPT = BRAND_IMAGE_TYPES.join(",");

export const BRAND_PAGE_SIZES = [10, 20, 50] as const;
export type BrandPageSize = (typeof BRAND_PAGE_SIZES)[number];
export const BRAND_DEFAULT_PAGE_SIZE: BrandPageSize = 10;

export const IMAGE_REQUIRED = "Brand image is required";
export const IMAGE_TOO_LARGE = "Image must be 2 MB or smaller";
export const IMAGE_BAD_TYPE = "Use a JPG, PNG or WEBP image";

export const brandIdSchema = z.cuid("Invalid brand");

export const brandNameSchema = z
  .string({ error: "Brand name is required" })
  .trim()
  .min(BRAND_NAME_MIN, `Brand name must be at least ${BRAND_NAME_MIN} characters`)
  .max(BRAND_NAME_MAX, `Brand name must be at most ${BRAND_NAME_MAX} characters`);

export const brandStatusSchema = z.enum(BRAND_STATUSES, { error: "Choose a valid status" });

// Preliminary check on what the browser reports (size, MIME type). Not trusted on its own:
// saveImage re-checks the bytes actually received.
const brandImageFile = z
  .file({ error: (issue) => (issue.input === undefined ? IMAGE_REQUIRED : "Choose an image file") })
  .max(BRAND_IMAGE_MAX_BYTES, IMAGE_TOO_LARGE)
  .mime([...BRAND_IMAGE_TYPES], IMAGE_BAD_TYPE);

/** An empty file input submits a 0-byte File with no name: treat it as "no file chosen". */
function emptyFileToUndefined(value: unknown): unknown {
  if (value === null || value === "") return undefined;
  if (typeof File !== "undefined" && value instanceof File && value.size === 0 && value.name === "") return undefined;
  return value;
}

export const createBrandSchema = z.object({
  name: brandNameSchema,
  status: brandStatusSchema,
  image: z.preprocess(emptyFileToUndefined, brandImageFile),
});

/** Editing: no new image keeps the current one. The slug never changes (not an input). */
export const updateBrandSchema = z.object({
  name: brandNameSchema,
  status: brandStatusSchema,
  image: z.preprocess(emptyFileToUndefined, brandImageFile.optional()),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type BrandField = keyof CreateBrandInput;

/**
 * FormData -> schema input, used by the client form (pre-submit check) and the server
 * actions so both validate the same shape. The status switch is a checkbox named "status"
 * with value "ACTIVE": unchecked sends nothing, which means INACTIVE.
 */
export function brandInputFromForm(formData: FormData) {
  const name = formData.get("name");
  const status = formData.get("status");
  return {
    name: typeof name === "string" ? name : "",
    status: status === null ? "INACTIVE" : status,
    image: formData.get("image"),
  };
}

// ---------------------------------------------------------------------------------------
// List page URL state (?q=&status=&page=&pageSize=). Invalid values fall back to defaults;
// a page past the end is clamped to the last page by listBrands.

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

export const brandListParamsSchema = z.object({
  q: z.preprocess(
    firstValue,
    z
      .string()
      .catch("")
      .transform((s) => s.trim().slice(0, BRAND_NAME_MAX)),
  ),
  status: z.preprocess(firstValue, brandStatusSchema.optional().catch(undefined)),
  page: z.preprocess(firstValue, z.coerce.number().int().min(1).max(1_000_000).catch(1)),
  pageSize: z.preprocess(
    firstValue,
    z.coerce.number().pipe(z.literal(BRAND_PAGE_SIZES)).catch(BRAND_DEFAULT_PAGE_SIZE),
  ),
});

export type BrandListParams = z.infer<typeof brandListParamsSchema>;

export function parseBrandListParams(searchParams: Record<string, string | string[] | undefined>): BrandListParams {
  return brandListParamsSchema.parse(searchParams);
}
