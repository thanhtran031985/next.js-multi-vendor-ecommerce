"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteBrandAction, toggleBrandStatusAction } from "@/app/actions/brands";
import { TrashIcon } from "@/components/icons/dashboard";
import { buttonClass, rowActionClass } from "@/components/brands/styles";
import { Dialog } from "@/components/ui/Dialog";
import { UNEXPECTED_ERROR } from "@/lib/actions/result";
import { BRANDS_PATH } from "@/lib/brands/list-url";
import type { BrandStatusValue } from "@/lib/brands/schema";

export type DeletableBrand = { id: string; name: string; status: BrandStatusValue; productCount: number };

const dialogButton = "h-11.5 rounded-md px-5 text-13-5";

/**
 * Delete button + confirmation dialog.
 * - icon: 32px red row action (list); button: outlined "Delete" (detail page header)
 * - brand still has products: deletion is blocked; offers "Deactivate instead" (toggle)
 * - `redirectToList`: after deleting, go back to the list (detail page); on the list the
 *   revalidated page simply drops the row.
 */
export function DeleteBrandButton({
  brand,
  variant = "icon",
  redirectToList = false,
}: {
  brand: DeletableBrand;
  variant?: "icon" | "button";
  redirectToList?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const blocked = brand.productCount > 0;

  function close() {
    setError(null);
    setOpen(false);
  }

  function run(work: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await work();
      } catch {
        // Network failure or server crash: the actions themselves never throw.
        setError(UNEXPECTED_ERROR);
      }
    });
  }

  function remove() {
    run(async () => {
      const result = await deleteBrandAction(brand.id, redirectToList ? "detail" : "list");
      if (!result.success) return setError(result.error);
      toast.success(`Deleted “${brand.name}”`);
      close();
      if (redirectToList) router.push(BRANDS_PATH);
    });
  }

  function deactivate() {
    run(async () => {
      const result = await toggleBrandStatusAction(brand.id, "INACTIVE");
      if (!result.success) return setError(result.error);
      toast.success(`“${brand.name}” is now inactive`);
      close();
    });
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Delete ${brand.name}`}
          title="Delete"
          className={`${rowActionClass.base} ${rowActionClass.delete}`}
        >
          <TrashIcon size={15} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${buttonClass.secondary} h-10.5 rounded-md px-4.5 text-13`}
        >
          <TrashIcon size={15} />
          Delete
        </button>
      )}

      {open && (
        <Dialog
          size="sm"
          title={`Delete “${brand.name}”?`}
          description={
            blocked
              ? `This brand still has ${brand.productCount} ${brand.productCount === 1 ? "product" : "products"}, so it can't be deleted.`
              : "This permanently removes the brand and its image. This can't be undone."
          }
          onClose={close}
          dismissible={!pending}
        >
          {blocked && (
            <p className="m-0 text-13 leading-150 text-ink-soft">
              {brand.status === "ACTIVE"
                ? "Set it to Inactive instead to hide it without losing its products."
                : "It is already Inactive. Move or remove its products first."}
            </p>
          )}
          {error && (
            <p role="alert" className="m-0 mt-3 text-13 leading-150 font-medium text-error">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2.5">
            <button type="button" onClick={close} disabled={pending} className={`${buttonClass.secondary} ${dialogButton}`}>
              Cancel
            </button>
            {blocked ? (
              brand.status === "ACTIVE" && (
                <button
                  type="button"
                  onClick={deactivate}
                  disabled={pending}
                  className={`${buttonClass.primary} ${dialogButton} font-semibold`}
                >
                  {pending ? "Saving…" : "Deactivate instead"}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className={`${buttonClass.danger} ${dialogButton} font-semibold`}
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
