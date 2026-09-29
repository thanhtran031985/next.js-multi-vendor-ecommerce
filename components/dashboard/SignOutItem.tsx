"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/actions/auth";
import { SpinnerIcon } from "@/components/icons";
import { LogOutIcon } from "@/components/icons/dashboard";

function Submit({ label, className, iconSize, role }: SignOutItemProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" role={role} disabled={pending} aria-busy={pending} className={className}>
      {pending ? <SpinnerIcon size={iconSize} /> : <LogOutIcon size={iconSize} strokeWidth={1.9} />}
      {pending ? "Signing out…" : label}
    </button>
  );
}

type SignOutItemProps = {
  label: string;
  className: string;
  iconSize: number;
  role?: "menuitem";
};

/**
 * Red "Sign out"/"Logout" row used by the dashboard user menu and the customer account
 * sidebar. Reuses the task-01 server action, which sends each role to its own login page.
 */
export function SignOutItem(props: SignOutItemProps) {
  return (
    <form action={signOutAction}>
      <Submit {...props} />
    </form>
  );
}
