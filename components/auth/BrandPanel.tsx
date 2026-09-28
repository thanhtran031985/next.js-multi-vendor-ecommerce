import type { ComponentType } from "react";
import { ReturnIcon, ShieldIcon, TruckIcon } from "@/components/icons";
import { Wordmark } from "@/components/Wordmark";

type Perk = { label: string; Icon: ComponentType<{ size?: number }> };

const shopperPerks: Perk[] = [
  { label: "Free delivery on orders over $50", Icon: TruckIcon },
  { label: "Secure Stripe checkout & buyer protection", Icon: ShieldIcon },
  { label: "7-day hassle-free returns", Icon: ReturnIcon },
];

/** Iris gradient panel beside the auth card (login/register mockups). */
export function BrandPanel({
  tagline = "One storefront, one checkout, thousands of independent sellers and brands.",
  perks = shopperPerks,
}: {
  tagline?: string;
  perks?: Perk[];
}) {
  return (
    <div className="relative flex min-h-130 flex-col justify-between gap-10 overflow-hidden rounded-2xl bg-linear-140 from-iris-900 via-iris-700 via-55% to-iris-500 px-12 py-13">
      <div aria-hidden="true" className="absolute -top-17.5 -right-10 size-70 rounded-full bg-white/7" />
      <div aria-hidden="true" className="absolute -bottom-22.5 -left-7.5 size-55 rounded-full bg-white/5" />
      <div className="relative">
        <Wordmark className="text-28 text-white" dotClassName="text-iris-300" />
        <p className="mt-4.5 max-w-80 text-14 leading-150 text-white/75">{tagline}</p>
      </div>
      <ul className="relative flex flex-col gap-4">
        {perks.map(({ label, Icon }) => (
          <li key={label} className="flex items-center gap-3 text-white">
            <span className="flex size-9.5 flex-none items-center justify-center rounded-md bg-white/14">
              <Icon size={19} />
            </span>
            <span className="text-13-5 leading-140 font-medium">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type { Perk };
