import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { BrandPanel, type Perk } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { BuildingIcon, PackageIcon, ShieldIcon } from "@/components/icons";
import { readCallbackUrl, redirectIfSignedIn } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Admin sign in" };

const adminPerks: Perk[] = [
  { label: "Oversee sellers, stores and catalog", Icon: BuildingIcon },
  { label: "Follow orders across every seller", Icon: PackageIcon },
  { label: "Access limited to admin accounts", Icon: ShieldIcon },
];

/** Same layout as the storefront login, without the storefront shell and without sign-up. */
export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  await redirectIfSignedIn();
  const callbackUrl = readCallbackUrl(await searchParams);

  return (
    <main className="flex min-h-screen items-center bg-bg">
      <div className="mx-auto grid w-full max-w-page items-stretch gap-10 px-(--cpad) py-14 lg:grid-cols-[1.05fr_.95fr]">
        <BrandPanel tagline="The operations console for the Covet marketplace." perks={adminPerks} />
        <AuthCard title="Admin sign in" subtitle="Sign in with your Covet admin account to continue.">
          <LoginForm callbackUrl={callbackUrl} />
          <p className="mt-7 mb-0 text-center text-13 leading-150 text-muted-soft">
            Admin accounts are created by the Covet team. There is no public sign-up.
          </p>
        </AuthCard>
      </div>
    </main>
  );
}
