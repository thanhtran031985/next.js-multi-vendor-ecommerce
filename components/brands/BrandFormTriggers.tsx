"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { EditIcon } from "@/components/icons/dashboard";
import { BrandFormDialog, type EditableBrand } from "@/components/brands/BrandFormDialog";
import { buttonClass, rowActionClass } from "@/components/brands/styles";

/**
 * "Add Brand" button + dialog.
 * - toolbar: 46px, Sora bold (VendorProductList "Add new product")
 * - empty: the empty-state button (Instrument Sans semibold, 12px radius)
 */
export function AddBrandButton({ variant = "toolbar" }: { variant?: "toolbar" | "empty" }) {
  const [open, setOpen] = useState(false);
  const shape =
    variant === "toolbar"
      ? "h-11.5 rounded-md px-5 font-display text-13 font-bold"
      : "h-11.5 rounded-control px-6 text-13-5 font-semibold";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonClass.primary} ${shape}`}>
        <PlusIcon size={17} />
        Add Brand
      </button>
      {open && <BrandFormDialog onClose={() => setOpen(false)} />}
    </>
  );
}

/**
 * Edit button + dialog.
 * - icon: 32px iris row action (list)
 * - button: outlined "Edit" button (detail page header)
 */
export function EditBrandButton({ brand, variant = "icon" }: { brand: EditableBrand; variant?: "icon" | "button" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Edit ${brand.name}`}
          title="Edit"
          className={`${rowActionClass.base} ${rowActionClass.edit}`}
        >
          <EditIcon size={15} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`${buttonClass.secondary} h-10.5 rounded-md px-4.5 text-13`}
        >
          <EditIcon size={15} />
          Edit
        </button>
      )}
      {open && <BrandFormDialog brand={brand} onClose={() => setOpen(false)} />}
    </>
  );
}
