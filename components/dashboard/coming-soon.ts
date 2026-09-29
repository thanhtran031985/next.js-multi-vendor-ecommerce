// Props for controls whose feature has no page/data yet: announced as disabled, native
// tooltip "Coming soon". Not the `disabled` attribute, so the tooltip still shows on hover.
export const COMING_SOON = "Coming soon";

export const comingSoonProps = {
  "aria-disabled": true,
  title: COMING_SOON,
} as const;
