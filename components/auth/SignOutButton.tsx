"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/actions/auth";
import { SpinnerIcon } from "@/components/icons";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-control border border-line bg-surface px-5 font-display text-13 leading-none font-bold text-ink transition-colors hover:bg-field focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-muted-soft"
    >
      {pending && <SpinnerIcon size={15} />}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

/** Server-action sign-out; the action sends each role back to its own login page. */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Submit />
    </form>
  );
}
