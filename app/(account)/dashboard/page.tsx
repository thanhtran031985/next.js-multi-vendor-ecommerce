import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EyeOffIcon, UserIcon } from "@/components/icons";
import { CameraIcon } from "@/components/icons/dashboard";
import { comingSoonProps } from "@/components/dashboard/coming-soon";
import { ProfileHeading } from "@/components/dashboard/ProfileHeading";
import { requireRole } from "@/lib/auth/guards";
import { getCustomerDashboard } from "@/lib/dashboard/customer";
import { formatDate } from "@/lib/dashboard/format";

export const metadata: Metadata = { title: "My account" };

/**
 * Customer dashboard: "Profile Info" (userdashboard mockup). Read-only for now: saving the
 * profile is a later task (decisions.md Q1), so the password fields, photo and Update
 * Profile button are disabled.
 */
export default async function CustomerDashboardPage() {
  const user = await requireRole("CUSTOMER"); // layouts don't re-run on client navigation; check here too
  const { profile } = await getCustomerDashboard(user.id);

  return (
    <>
      <ProfileHeading />

      <div className="mt-5 mb-8.5 flex flex-col items-center">
        <div className="relative">
          <div className="flex size-30 items-center justify-center rounded-full border border-iris-100 bg-linear-135 from-iris-100 to-iris-50 text-iris-400">
            <UserIcon size={56} strokeWidth={1.6} />
          </div>
          <span
            role="button"
            aria-label="Change photo"
            className="absolute right-1 bottom-1 flex size-8.5 cursor-not-allowed items-center justify-center rounded-full border-3 border-white bg-iris-500 text-white"
            {...comingSoonProps}
          >
            <CameraIcon size={16} />
          </span>
        </div>
        <div className="mt-4 font-display text-18 leading-none font-bold text-ink">{profile.fullName}</div>
        <div className="mt-2 text-13 leading-none text-muted">Member since {formatDate(profile.memberSince)}</div>
      </div>

      <div className="mx-auto grid max-w-profile gap-x-6 gap-y-5.5 md:grid-cols-2">
        <Field id="first-name" label="First Name">
          <TextInput id="first-name" value={profile.firstName} />
        </Field>
        <Field id="last-name" label="Last Name">
          <TextInput id="last-name" value={profile.lastName} />
        </Field>
        <Field id="phone" label="Phone Number">
          <TextInput id="phone" value={profile.phone ?? ""} placeholder="Not added yet" />
        </Field>
        <Field id="email" label="Email">
          <TextInput id="email" type="email" value={profile.email} />
        </Field>
        <Field id="new-password" label="New Password">
          <PasswordInput id="new-password" />
        </Field>
        <Field id="confirm-password" label="Confirm Password">
          <PasswordInput id="confirm-password" />
        </Field>
      </div>

      <div className="mx-auto mt-8 flex max-w-profile justify-end">
        <span
          role="button"
          className="flex h-12 cursor-not-allowed items-center rounded-control bg-iris-500 px-8.5 font-display text-14 leading-none font-bold text-white opacity-60"
          {...comingSoonProps}
        >
          Update Profile
        </span>
      </div>
    </>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2.25 block text-13 leading-none font-semibold text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}

const box = "h-12 w-full rounded-md border border-line bg-bg-subtle text-14 leading-none text-ink outline-none";

function TextInput({ id, value, type = "text", placeholder }: { id: string; value: string; type?: string; placeholder?: string }) {
  return <input id={id} type={type} value={value} placeholder={placeholder} readOnly className={`${box} px-3.75`} />;
}

function PasswordInput({ id }: { id: string }) {
  return (
    <div className={`flex cursor-not-allowed items-center overflow-hidden ${box}`} {...comingSoonProps}>
      <input
        id={id}
        type="password"
        disabled
        placeholder="Minimum 8 characters long"
        className="h-full min-w-0 flex-1 cursor-not-allowed bg-transparent px-3.75 text-14 leading-none text-ink outline-none"
      />
      <span className="px-3.5 text-muted-soft">
        <EyeOffIcon size={18} />
      </span>
    </div>
  );
}
