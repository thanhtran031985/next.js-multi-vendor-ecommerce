"use client";

import { registerCustomerAction } from "@/app/actions/auth";
import {
  customerRegisterInputFromForm,
  customerRegisterSchema,
  type CustomerRegisterField,
} from "@/lib/validation/auth";
import { CheckboxField, PasswordField, SubmitButton, TextField, useAuthForm } from "./form-kit";

export function CustomerRegisterForm() {
  const { formAction, onSubmit, pending, errors, values } = useAuthForm<CustomerRegisterField>(
    registerCustomerAction,
    customerRegisterSchema,
    customerRegisterInputFromForm,
  );

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="flex flex-col">
      <div className="flex flex-col gap-5">
        <TextField
          name="name"
          label="Name"
          placeholder="Your full name"
          autoComplete="name"
          required
          defaultValue={values.name}
          error={errors.name}
        />
        <TextField
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          defaultValue={values.email}
          error={errors.email}
        />
        <PasswordField
          name="password"
          label="Password"
          placeholder="Minimum 8 characters long"
          autoComplete="new-password"
          required
          error={errors.password}
        />
      </div>
      <div className="mt-5.5 mb-6">
        <CheckboxField name="acceptTerms" defaultChecked={values.acceptTerms === "on"} error={errors.acceptTerms}>
          I agree to Covet&apos;s{" "}
          <a href="#" className="font-semibold">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="font-semibold">
            Privacy Policy
          </a>
          .
        </CheckboxField>
      </div>
      <SubmitButton pending={pending} label="Create account" pendingLabel="Creating account…" className="h-13 w-full text-14" />
    </form>
  );
}
