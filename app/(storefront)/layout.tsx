import type { ReactNode } from "react";
import { MegaNav, StorefrontFooter, StorefrontHeader, UtilityBar } from "@/components/storefront/StorefrontChrome";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <UtilityBar />
      <StorefrontHeader />
      <MegaNav />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
