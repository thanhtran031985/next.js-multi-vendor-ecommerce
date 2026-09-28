"use client";

// Shown by /vendor/pending when the DB says the store is APPROVED but the session token
// still carries the old status: refresh the token (jwt callback re-reads the DB on
// trigger "update"), then open the dashboard. No sign-out/sign-in needed.

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { SpinnerIcon } from "@/components/icons";

function RefreshAndRedirect() {
  const { update } = useSession();
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    update().finally(() => router.replace("/vendor/dashboard"));
  }, [update, router]);

  return (
    <p role="status" className="flex items-center justify-center gap-2 text-14 leading-150 text-muted">
      <SpinnerIcon size={16} className="text-iris-500" />
      Your store is approved. Opening your dashboard…
    </p>
  );
}

export function ApprovedRedirect() {
  return (
    <SessionProvider>
      <RefreshAndRedirect />
    </SessionProvider>
  );
}
