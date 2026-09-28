"use client";

import { registerVendorAction } from "@/app/actions/auth";
import { vendorRegisterInputFromForm, vendorRegisterSchema, type VendorRegisterField } from "@/lib/validation/auth";
import { PasswordField, SubmitButton, TextField, useAuthForm } from "./form-kit";

export function VendorRegisterForm() {
  const { formAction, onSubmit, pending, errors, values } = useAuthForm<VendorRegisterField>(
    registerVendorAction,
    vendorRegisterSchema,
    vendorRegisterInputFromForm,
  );

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate>
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <TextField
          name="name"
          label="Full Name"
          variant="compact"
          requiredMark
          required
          placeholder="Ex: Jordan Ellis"
          autoComplete="name"
          defaultValue={values.name}
          error={errors.name}
        />
        <TextField
          name="storeName"
          label="Store Name"
          variant="compact"
          requiredMark
          required
          placeholder="Ex: Hanover Electronics"
          autoComplete="organization"
          defaultValue={values.storeName}
          error={errors.storeName}
        />
        <div className="sm:col-span-2">
          <TextField
            name="email"
            type="email"
            label="Email"
            variant="compact"
            requiredMark
            required
            placeholder="Ex: example@gmail.com"
            autoComplete="email"
            defaultValue={values.email}
            error={errors.email}
          />
        </div>
        <PasswordField
          name="password"
          label="Password"
          variant="compact"
          requiredMark
          required
          placeholder="Minimum 8 characters long"
          autoComplete="new-password"
          error={errors.password}
        />
        <PasswordField
          name="confirmPassword"
          label="Confirm Password"
          variant="compact"
          requiredMark
          required
          placeholder="Confirm password"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />
      </div>
      <div className="mt-6 flex justify-end">
        <SubmitButton pending={pending} label="Create store" pendingLabel="Creating store…" className="h-12 px-7 text-14" />
      </div>
    </form>
  );
}
