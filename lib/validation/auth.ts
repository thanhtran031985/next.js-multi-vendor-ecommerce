// Zod schemas for auth forms, shared by server actions and client forms.

import { z } from "zod";

export const emailSchema = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .max(191, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const nameSchema = z
  .string({ error: "Name is required" })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name must be at most 80 characters");

export const storeNameSchema = z
  .string({ error: "Store name is required" })
  .trim()
  .min(2, "Store name must be at least 2 characters")
  .max(80, "Store name must be at most 80 characters");

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected rather
// than silently truncated.
const utf8Bytes = (value: string) => new TextEncoder().encode(value).length;

export const passwordSchema = z
  .string({ error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .refine((v) => utf8Bytes(v) <= 72, "Password is too long")
  .refine((v) => /\p{L}/u.test(v), "Password must contain a letter")
  .refine((v) => /\d/.test(v), "Password must contain a number");

/**
 * Sign-in only checks presence: the password policy is enforced at registration, and
 * repeating it here would tell an attacker which guesses are impossible.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Password is required" }).min(1, "Password is required").max(256),
});

export const customerRegisterSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal(true, "You must agree to the Terms and Privacy Policy"),
});

export const vendorRegisterSchema = z
  .object({
    name: nameSchema,
    storeName: storeNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({ error: "Confirm your password" }).min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
    // Also report a mismatch while other fields are still invalid.
    when: ({ value }) => {
      const v = value as { password?: unknown; confirmPassword?: unknown };
      return typeof v.password === "string" && typeof v.confirmPassword === "string" && v.confirmPassword !== "";
    },
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type VendorRegisterInput = z.infer<typeof vendorRegisterSchema>;

export type LoginField = keyof LoginInput;
export type CustomerRegisterField = keyof CustomerRegisterInput;
export type VendorRegisterField = keyof VendorRegisterInput;

/**
 * Result of a form server action (the state for useActionState).
 * - fieldErrors: first message per field, shown under that field.
 * - formError: form-level message, shown as a toast.
 * - values: non-secret inputs echoed back so the form keeps them after an error.
 *   Passwords are never echoed.
 */
export type FormState<Field extends string = string> = {
  fieldErrors?: Partial<Record<Field, string>>;
  formError?: string;
  values?: Partial<Record<Field, string>>;
};

// FormData -> schema input. Used by both the client forms (pre-submit validation) and the
// server actions, so both sides validate exactly the same shape.

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function loginInputFromForm(formData: FormData) {
  return { email: text(formData, "email"), password: text(formData, "password") };
}

export function customerRegisterInputFromForm(formData: FormData) {
  return {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    acceptTerms: formData.get("acceptTerms") === "on",
  };
}

export function vendorRegisterInputFromForm(formData: FormData) {
  return {
    name: text(formData, "name"),
    storeName: text(formData, "storeName"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  };
}

/** First error message per field from a failed parse. */
export function firstFieldErrors<Field extends string>(error: z.ZodError): Partial<Record<Field, string>> {
  const out: Partial<Record<Field, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) out[key as Field] = issue.message;
  }
  return out;
}
