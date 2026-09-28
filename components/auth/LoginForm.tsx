"use client";

import type { ReactNode } from "react";
import { loginAction } from "@/app/actions/auth";
import { loginInputFromForm, loginSchema, type LoginField } from "@/lib/validation/auth";
import { PasswordField, SubmitButton, TextField, useAuthForm } from "./form-kit";

type Variant = "storefront" | "vendor";

const copy: Record<Variant, { email: string; emailPlaceholder: string; passwordPlaceholder: string }> = {
  storefront: { email: "Email", emailPlaceholder: "you@example.com", passwordPlaceholder: "Enter your password" },
  vendor: { email: "Your Email", emailPlaceholder: "email@address.com", passwordPlaceholder: "8+ characters required" },
};

/**
 * One sign-in form for every role (customer, vendor, admin). `callbackUrl` is passed through
 * untouched; the server sanitises it against the signed-in user's role.
 */
export function LoginForm({
  variant = "storefront",
  callbackUrl,
  beforeSubmit,
}: {
  variant?: Variant;
  callbackUrl?: string;
  /** Row rendered between the fields and the button (vendor mockup: "Register New Account"). */
  beforeSubmit?: ReactNode;
}) {
  const { formAction, onSubmit, pending, errors, values } = useAuthForm<LoginField>(
    loginAction,
    loginSchema,
    loginInputFromForm,
  );
  const text = copy[variant];
  const vendor = variant === "vendor";

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <div className={`flex flex-col ${vendor ? "gap-5.5" : "gap-5"}`}>
        <TextField
          name="email"
          type="email"
          label={text.email}
          variant={variant}
          placeholder={text.emailPlaceholder}
          autoComplete="email"
          required
          defaultValue={values.email}
          error={errors.email}
        />
        <PasswordField
          name="password"
          label="Password"
          variant={variant}
          placeholder={text.passwordPlaceholder}
          autoComplete="current-password"
          required
          error={errors.password}
        />
      </div>
      {beforeSubmit}
      <SubmitButton
        pending={pending}
        label="Sign in"
        pendingLabel="Signing in…"
        className={vendor ? "h-13.5 w-full text-15" : "mt-6.5 h-13 w-full text-14"}
      />
    </form>
  );
}
