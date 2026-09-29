import type { ReactNode } from "react";

/** White form card beside the brand panel (login/register mockups). */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-line-soft bg-surface px-6 py-8 shadow-xs sm:px-11.5 sm:py-11">
      <h1 className="m-0 font-display text-28 leading-none font-extrabold tracking-heading text-ink">{title}</h1>
      <p className="mt-3 mb-7.5 text-14 leading-150 text-muted">{subtitle}</p>
      {children}
    </div>
  );
}

/** "Don't have an account? Create one" line under the form. */
export function AuthSwitch({ children }: { children: ReactNode }) {
  return <p className="mt-7 mb-0 text-center text-13-5 leading-none text-muted">{children}</p>;
}
