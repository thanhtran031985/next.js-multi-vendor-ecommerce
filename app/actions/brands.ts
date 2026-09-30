"use server";

// Admin brand actions. Every action, in this order: requireAdminAction() -> Zod ->
// service -> revalidatePath -> ActionResult. Thin on purpose: the logic lives in
// lib/brands/service.ts. Never redirects and never throws raw errors to the client.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, invalidInput, ok, unexpected, type ActionResult } from "@/lib/actions/result";
import { requireAdminAction } from "@/lib/actions/require-admin";
import type { BrandRecord } from "@/lib/brands/queries";
import {
  brandIdSchema,
  brandInputFromForm,
  brandStatusSchema,
  createBrandSchema,
  updateBrandSchema,
  type BrandStatusValue,
} from "@/lib/brands/schema";
import { createBrand, deleteBrand, setBrandStatus, updateBrand, type BrandServiceResult } from "@/lib/brands/service";

const LIST_PATH = "/admin/brands";
const detailPath = (id: string) => `${LIST_PATH}/${id}`;

/** Service result -> action result (a field-specific failure becomes a field error). */
function fromService<T>(result: BrandServiceResult<T>): ActionResult<T> {
  if (result.ok) return ok(result.data);
  return result.field ? fail(result.error, { [result.field]: [result.error] }) : fail(result.error);
}

export async function createBrandAction(formData: FormData): Promise<ActionResult<BrandRecord>> {
  const admin = await requireAdminAction();
  if (!admin.ok) return admin.result;

  const parsed = createBrandSchema.safeParse(brandInputFromForm(formData));
  if (!parsed.success) return invalidInput(parsed.error);

  try {
    const result = await createBrand(parsed.data);
    if (result.ok) revalidatePath(LIST_PATH);
    return fromService(result);
  } catch (err) {
    return unexpected("createBrandAction", err);
  }
}

export async function updateBrandAction(id: string, formData: FormData): Promise<ActionResult<BrandRecord>> {
  const admin = await requireAdminAction();
  if (!admin.ok) return admin.result;

  const brandId = brandIdSchema.safeParse(id);
  if (!brandId.success) return invalidInput(brandId.error);
  const parsed = updateBrandSchema.safeParse(brandInputFromForm(formData));
  if (!parsed.success) return invalidInput(parsed.error);

  try {
    const result = await updateBrand(brandId.data, parsed.data);
    if (result.ok) {
      revalidatePath(LIST_PATH);
      revalidatePath(detailPath(brandId.data));
    }
    return fromService(result);
  } catch (err) {
    return unexpected("updateBrandAction", err);
  }
}

const deleteFromSchema = z.enum(["list", "detail"]);

/**
 * Refused while the brand has products (the message suggests setting it to Inactive).
 * `from` = the page the delete button is on. From the detail page nothing is revalidated:
 * that page is about to be replaced by the list (a fresh dynamic render), and revalidating it
 * would re-render the deleted brand's page as a 404 before the redirect happens.
 */
export async function deleteBrandAction(
  id: string,
  from: "list" | "detail" = "list",
): Promise<ActionResult<{ id: string; name: string }>> {
  const admin = await requireAdminAction();
  if (!admin.ok) return admin.result;

  const brandId = brandIdSchema.safeParse(id);
  if (!brandId.success) return invalidInput(brandId.error);
  const page = deleteFromSchema.safeParse(from);
  if (!page.success) return invalidInput(page.error);

  try {
    const result = await deleteBrand(brandId.data);
    if (result.ok && page.data === "list") revalidatePath(LIST_PATH);
    return fromService(result);
  } catch (err) {
    return unexpected("deleteBrandAction", err);
  }
}

const toggleSchema = z.object({ id: brandIdSchema, status: brandStatusSchema });

/** Sets the status the switch now shows (idempotent, so a retried click cannot flip it back). */
export async function toggleBrandStatusAction(
  id: string,
  status: BrandStatusValue,
): Promise<ActionResult<{ id: string; status: BrandStatusValue }>> {
  const admin = await requireAdminAction();
  if (!admin.ok) return admin.result;

  const parsed = toggleSchema.safeParse({ id, status });
  if (!parsed.success) return invalidInput(parsed.error);

  try {
    const result = await setBrandStatus(parsed.data.id, parsed.data.status);
    if (result.ok) {
      revalidatePath(LIST_PATH);
      revalidatePath(detailPath(parsed.data.id));
    }
    return fromService(result);
  } catch (err) {
    return unexpected("toggleBrandStatusAction", err);
  }
}
