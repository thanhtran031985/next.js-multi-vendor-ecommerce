"use client";

// Building blocks for the auth forms: fields, password toggle, checkbox, submit button and
// the useAuthForm hook (useActionState + client-side Zod pre-check + formError toast).

import { useActionState, useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import type { z } from "zod";
import { CheckIcon, EyeIcon, EyeOffIcon, SpinnerIcon } from "@/components/icons";
import { firstFieldErrors, type FormState } from "@/lib/validation/auth";

// ---------------------------------------------------------------------------
// useAuthForm
// ---------------------------------------------------------------------------

type FormAction<F extends string> = (state: FormState<F>, formData: FormData) => Promise<FormState<F>>;

/**
 * Wires a server action to a form:
 * - validates with the same Zod schema before submitting (no round trip for obvious mistakes);
 * - shows server fieldErrors under fields and formError as a toast;
 * - exposes `pending` for the submit button.
 */
export function useAuthForm<F extends string>(
  action: FormAction<F>,
  schema: z.ZodType,
  toInput: (formData: FormData) => unknown,
) {
  const [state, formAction, pending] = useActionState(action, {} as FormState<F>);
  const [clientErrors, setClientErrors] = useState<Partial<Record<F, string>> | null>(null);

  useEffect(() => {
    if (state.formError) toast.error(state.formError, { id: "auth-form-error" });
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = schema.safeParse(toInput(new FormData(event.currentTarget)));
    if (parsed.success) {
      setClientErrors(null);
    } else {
      event.preventDefault(); // stops the action from running
      setClientErrors(firstFieldErrors<F>(parsed.error));
    }
  }

  const errors: Partial<Record<F, string>> = pending ? {} : (clientErrors ?? state.fieldErrors ?? {});
  const values: Partial<Record<F, string>> = state.values ?? {};
  return { formAction, onSubmit, pending, errors, values };
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

/** Mockup variants: storefront (login/register cards), vendor (vendor login), compact (vendor register). */
export type FieldVariant = "storefront" | "vendor" | "compact";

const labelClass: Record<FieldVariant, string> = {
  storefront: "mb-2.25 text-13 font-semibold",
  vendor: "mb-2.5 text-13 font-medium",
  compact: "mb-2.25 text-12-5 font-semibold",
};

const boxClass: Record<FieldVariant, string> = {
  storefront: "h-12.5 rounded-control",
  vendor: "h-13 rounded-control",
  compact: "h-12 rounded-md",
};

const inputPad: Record<FieldVariant, string> = {
  storefront: "px-3.75 text-14",
  vendor: "px-4 text-14",
  compact: "px-3.5 text-13-5",
};

const toggleClass: Record<FieldVariant, { pad: string; size: number }> = {
  storefront: { pad: "px-3.5", size: 18 },
  vendor: { pad: "px-4", size: 19 },
  compact: { pad: "px-3.5", size: 17 },
};

// Border/background + focus ring shared by plain inputs and the password wrapper.
const frame =
  "border border-line bg-bg-subtle transition-[border-color,box-shadow,background-color] duration-200 " +
  "data-[invalid=true]:border-error";
const frameFocus = "focus:border-iris-500 focus:bg-surface focus:ring-3 focus:ring-iris-100";
const frameFocusWithin =
  "focus-within:border-iris-500 focus-within:bg-surface focus-within:ring-3 focus-within:ring-iris-100";

type FieldBaseProps = {
  name: string;
  label: string;
  variant?: FieldVariant;
  error?: string;
  required?: boolean;
  /** Show the red asterisk used by the vendor registration mockup. */
  requiredMark?: boolean;
  labelAside?: ReactNode;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
};

function FieldLabel({
  htmlFor,
  label,
  variant,
  requiredMark,
  aside,
}: {
  htmlFor: string;
  label: string;
  variant: FieldVariant;
  requiredMark?: boolean;
  aside?: ReactNode;
}) {
  const text = (
    <label htmlFor={htmlFor} className={`block leading-none text-ink-soft ${aside ? "" : labelClass[variant]}`}>
      {label}
      {requiredMark && <span className="text-error-solid"> *</span>}
    </label>
  );
  if (!aside) return text;
  return (
    <div className={`flex items-center justify-between ${labelClass[variant]}`}>
      {text}
      {aside}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-12-5 leading-140 text-error">
      {message}
    </p>
  );
}

export function TextField({
  name,
  label,
  type = "text",
  variant = "storefront",
  error,
  required,
  requiredMark,
  labelAside,
  placeholder,
  autoComplete,
  defaultValue,
}: FieldBaseProps & { type?: "text" | "email" }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} variant={variant} requiredMark={requiredMark} aside={labelAside} />
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        data-invalid={error ? true : undefined}
        className={`w-full ${boxClass[variant]} ${inputPad[variant]} ${frame} ${frameFocus} font-sans leading-none text-ink outline-none`}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function PasswordField({
  name,
  label,
  variant = "storefront",
  error,
  required,
  requiredMark,
  labelAside,
  placeholder,
  autoComplete = "current-password",
}: Omit<FieldBaseProps, "defaultValue">) {
  const id = useId();
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);
  const toggle = toggleClass[variant];
  return (
    <div>
      <FieldLabel htmlFor={id} label={label} variant={variant} requiredMark={requiredMark} aside={labelAside} />
      <div
        data-invalid={error ? true : undefined}
        className={`flex items-center overflow-hidden ${boxClass[variant]} ${frame} ${frameFocusWithin}`}
      >
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-full min-w-0 flex-1 bg-transparent ${inputPad[variant]} font-sans leading-none text-ink outline-none`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className={`flex h-full items-center ${toggle.pad} text-muted-soft transition-colors hover:text-muted focus-visible:text-iris-500 focus-visible:outline-none`}
        >
          {visible ? <EyeIcon size={toggle.size} /> : <EyeOffIcon size={toggle.size} />}
        </button>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

export function CheckboxField({
  name,
  error,
  defaultChecked,
  children,
}: {
  name: string;
  error?: string;
  defaultChecked?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <span className="relative mt-px flex size-4.75 flex-none">
          <input
            id={id}
            name={name}
            type="checkbox"
            defaultChecked={defaultChecked}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="peer size-full cursor-pointer appearance-none rounded-xs border-[1.5px] border-control-border bg-surface transition-colors checked:border-iris-500 checked:bg-iris-500 focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none aria-invalid:border-error"
          />
          <CheckIcon
            size={12}
            className="pointer-events-none absolute inset-0 m-auto hidden text-white peer-checked:block"
          />
        </span>
        <label htmlFor={id} className="cursor-pointer text-12-5 leading-150 text-muted">
          {children}
        </label>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Submit button
// ---------------------------------------------------------------------------

export function SubmitButton({
  pending,
  label,
  pendingLabel,
  className = "",
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  /** Size/shape classes from the mockup (height, width, font size). */
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-control bg-iris-500 font-display leading-none font-bold text-white transition-colors hover:bg-iris-600 focus-visible:ring-3 focus-visible:ring-iris-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-iris-300 ${className}`}
    >
      {pending && <SpinnerIcon size={16} />}
      {pending ? pendingLabel : label}
    </button>
  );
}
