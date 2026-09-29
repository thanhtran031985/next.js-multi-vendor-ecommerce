"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useTransition, type DragEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import { createBrandAction, updateBrandAction } from "@/app/actions/brands";
import { FieldError, SubmitButton } from "@/components/auth/form-kit";
import { UploadIcon } from "@/components/icons";
import { buttonClass } from "@/components/brands/styles";
import { Dialog } from "@/components/ui/Dialog";
import { Switch } from "@/components/ui/Switch";
import { UNEXPECTED_ERROR } from "@/lib/actions/result";
import {
  BRAND_IMAGE_ACCEPT,
  BRAND_NAME_MAX,
  brandInputFromForm,
  createBrandSchema,
  updateBrandSchema,
  type BrandField,
  type BrandStatusValue,
} from "@/lib/brands/schema";
import { firstFieldErrors } from "@/lib/validation/auth";

export type EditableBrand = { id: string; name: string; image: string | null; status: BrandStatusValue };

type FieldErrors = Partial<Record<BrandField, string>>;

/** First message per field from an action's fieldErrors. */
function firstOf(fieldErrors?: Record<string, string[]>): FieldErrors {
  const out: FieldErrors = {};
  for (const [field, messages] of Object.entries(fieldErrors ?? {})) {
    if (messages[0]) out[field as BrandField] = messages[0];
  }
  return out;
}

// VendorAddProduct mockup: 46px fields on --bg-subtle, iris focus ring, red border when invalid.
const inputClass =
  "h-11.5 w-full rounded-md border border-line bg-bg-subtle px-3.5 text-13-5 leading-none text-ink transition-[border-color,box-shadow,background-color] duration-200 outline-none focus:border-iris-500 focus:bg-surface focus:ring-3 focus:ring-iris-100 aria-invalid:border-error";
const labelClass = "mb-2.25 block text-12-5 leading-none font-semibold text-ink-soft";

/**
 * Add/edit brand dialog. Pass `brand` to edit. Render only while open; `onClose` unmounts it.
 * - Client pre-check with the same Zod schema as the server action.
 * - The form is submitted by calling the action directly (not <form action>), so a failed
 *   save keeps everything typed, including the chosen file.
 * - Success: toast, close; the list refreshes through the action's revalidatePath.
 */
export function BrandFormDialog({ brand, onClose }: { brand?: EditableBrand; onClose: () => void }) {
  const editing = brand !== undefined;
  const ids = { name: useId(), image: useId(), hint: useId() };
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [active, setActive] = useState(brand ? brand.status === "ACTIVE" : true);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Revoke the previous preview URL when it is replaced, and the last one on close.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  function showFile(file: File | null) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
    setPreview(file ? { url: URL.createObjectURL(file), name: file.name } : null);
  }

  function removeFile() {
    if (fileRef.current) fileRef.current.value = "";
    showFile(null);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    const input = fileRef.current;
    if (!file || !input) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    showFile(file);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = (editing ? updateBrandSchema : createBrandSchema).safeParse(brandInputFromForm(formData));
    if (!parsed.success) {
      setErrors(firstFieldErrors<BrandField>(parsed.error));
      return;
    }
    setErrors({});
    startTransition(async () => {
      try {
        const result = editing ? await updateBrandAction(brand.id, formData) : await createBrandAction(formData);
        if (result.success) {
          toast.success(editing ? `"${result.data.name}" saved` : `"${result.data.name}" added`);
          onClose();
          return;
        }
        const fieldErrors = firstOf(result.fieldErrors);
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length === 0) toast.error(result.error);
      } catch {
        // Network failure, or the request was refused before reaching the action.
        toast.error(UNEXPECTED_ERROR);
      }
    });
  }

  const shownImage = preview?.url ?? brand?.image ?? null;

  return (
    <Dialog
      title={editing ? "Edit Brand" : "Add Brand"}
      description={editing ? "Update the brand name, image or status." : "Brands group products by who makes them."}
      onClose={onClose}
      dismissible={!pending}
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div>
          <label htmlFor={ids.name} className={labelClass}>
            Brand Name <span className="text-error-solid">*</span>
          </label>
          <input
            id={ids.name}
            name="name"
            defaultValue={brand?.name}
            maxLength={BRAND_NAME_MAX}
            placeholder="e.g. Sony"
            autoComplete="off"
            data-autofocus
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${ids.name}-error` : undefined}
            className={inputClass}
          />
          <FieldError id={`${ids.name}-error`} message={errors.name} />
        </div>

        <div>
          <span id={`${ids.image}-label`} className={labelClass}>
            Brand Image {!editing && <span className="text-error-solid">*</span>}
          </span>
          <input
            ref={fileRef}
            id={ids.image}
            type="file"
            name="image"
            accept={BRAND_IMAGE_ACCEPT}
            onChange={(e) => showFile(e.target.files?.[0] ?? null)}
            aria-labelledby={`${ids.image}-label`}
            aria-invalid={errors.image ? true : undefined}
            aria-describedby={errors.image ? `${ids.image}-error ${ids.hint}` : ids.hint}
            className="peer sr-only"
          />
          <label
            htmlFor={ids.image}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex min-h-30 cursor-pointer items-center justify-center gap-4 rounded-control border-[0.09375rem] border-dashed bg-bg-subtle p-5 text-iris-500 transition-colors peer-focus-visible:ring-3 peer-focus-visible:ring-iris-100 hover:border-iris-500 peer-aria-invalid:border-error ${
              dragging ? "border-iris-500 bg-iris-25" : "border-control-border"
            }`}
          >
            {shownImage && (
              <span className="relative size-20 flex-none overflow-hidden rounded-md border border-line-soft bg-surface">
                <Image
                  src={shownImage}
                  alt={preview ? "New image preview" : "Current image"}
                  fill
                  sizes="80px"
                  unoptimized={Boolean(preview)}
                  className="object-contain"
                />
              </span>
            )}
            <span className="flex flex-col items-center gap-2 text-center">
              <UploadIcon size={22} />
              <span className="text-11 leading-140 font-medium">
                {shownImage ? "Click or drop to replace" : "Click To Upload"}
                <br />
                {shownImage ? "the image" : "Or Drag And Drop"}
              </span>
            </span>
          </label>
          <FieldError id={`${ids.image}-error`} message={errors.image} />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <p id={ids.hint} className="m-0 text-11 leading-150 text-muted-soft">
              JPG, PNG, WEBP · Max 2MB{editing && !preview ? " · Leave empty to keep the current image" : ""}
            </p>
            {preview && (
              <button
                type="button"
                onClick={removeFile}
                className="cursor-pointer text-12 leading-none font-semibold text-error hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Remove {preview.name.length > 28 ? "new image" : `"${preview.name}"`}
              </button>
            )}
          </div>
        </div>

        <div>
          <span className={labelClass}>Status</span>
          <div className="flex h-11.5 items-center justify-between rounded-md border border-line bg-bg-subtle px-3.5">
            <span className="text-13-5 leading-none text-ink-soft">{active ? "Active" : "Inactive"}</span>
            <Switch
              name="status"
              value="ACTIVE"
              label="Brand is active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className={`${buttonClass.secondary} h-12 rounded-control px-7.5 text-14`}
          >
            Cancel
          </button>
          <SubmitButton
            pending={pending}
            label={editing ? "Save Changes" : "Add Brand"}
            pendingLabel="Saving…"
            className="h-12 px-8.5 text-14"
          />
        </div>
      </form>
    </Dialog>
  );
}
