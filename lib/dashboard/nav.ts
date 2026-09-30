// Dashboard navigation for the three roles (task 02). Pure data: no React, no Prisma.
// `enabled: false` items have no page yet: they render dimmed, not as links, with a
// "Coming soon" tooltip. When a later task adds the page, flip `enabled` to true.
// `href` is the planned route; keep it inside the role's area so proxy.ts guards it.

export type NavIconName =
  | "home"
  | "box"
  | "bag"
  | "send"
  | "speaker"
  | "chart"
  | "users"
  | "sliders"
  | "layout"
  | "monitor"
  | "user"
  | "orders"
  | "refresh"
  | "heart"
  | "wallet"
  | "award"
  | "mail"
  | "pin"
  | "life"
  | "share"
  | "ticket"
  | "truck";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIconName;
  enabled: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

/** Seller/admin shell: white sidebar with grouped links, plus an optional dark icon rail (vendor only). */
export type ShellNav = { rail?: NavItem[]; groups: NavGroup[] };

/** Customer account sidebar (userdashboard mockup). Only Profile Info has a page. */
export const customerNav: NavItem[] = [
  { label: "Profile Info", href: "/dashboard", icon: "user", enabled: true },
  { label: "My Orders", href: "/dashboard/orders", icon: "orders", enabled: false },
  { label: "Restock Requests", href: "/dashboard/restock-requests", icon: "refresh", enabled: false },
  { label: "Wish List", href: "/dashboard/wishlist", icon: "heart", enabled: false },
  { label: "My Wallet", href: "/dashboard/wallet", icon: "wallet", enabled: false },
  { label: "My Loyalty Point", href: "/dashboard/loyalty", icon: "award", enabled: false },
  { label: "Inbox", href: "/dashboard/inbox", icon: "mail", enabled: false },
  { label: "My Address", href: "/dashboard/addresses", icon: "pin", enabled: false },
  { label: "Support Ticket", href: "/dashboard/support", icon: "life", enabled: false },
  { label: "Refer & Earn", href: "/dashboard/refer", icon: "share", enabled: false },
  { label: "Coupons", href: "/dashboard/coupons", icon: "ticket", enabled: false },
  { label: "Track Order", href: "/dashboard/track-order", icon: "truck", enabled: false },
];

// Rail labels are not in the mockups (icons only); inferred from the icons, see decisions.md.
function railFor(root: string): NavItem[] {
  return [
    { label: "Home", href: root, icon: "home", enabled: true },
    { label: "Products", href: `${root}/products`, icon: "box", enabled: false },
    { label: "Orders", href: `${root}/orders`, icon: "bag", enabled: false },
    { label: "Messages", href: `${root}/messages`, icon: "send", enabled: false },
    { label: "Promotions", href: `${root}/promotions`, icon: "speaker", enabled: false },
    { label: "Reports", href: `${root}/reports`, icon: "chart", enabled: false },
    { label: "Customers", href: `${root}/customers`, icon: "users", enabled: false },
    { label: "Settings", href: `${root}/settings`, icon: "sliders", enabled: false },
  ];
}

function overviewFor(root: string): NavGroup {
  return {
    label: "Overview",
    items: [
      { label: "Dashboard", href: root, icon: "layout", enabled: true },
      { label: "POS", href: `${root}/pos`, icon: "monitor", enabled: false },
    ],
  };
}

export const vendorNav: ShellNav = {
  rail: railFor("/vendor/dashboard"),
  groups: [overviewFor("/vendor/dashboard")],
};

// No rail: the admin frame has no icon rail (task 04).
export const adminNav: ShellNav = {
  groups: [
    overviewFor("/admin/dashboard"),
    // AdminProductList mockup: Catalog sidebar -> "Organization" -> "Brand Setup" (task 03).
    {
      label: "Organization",
      items: [{ label: "Brand Setup", href: "/admin/brands", icon: "box", enabled: true }],
    },
  ],
};

/**
 * Whether a nav item is the current page. Rail items match their whole section (the
 * longest matching href wins); sidebar and account items match their exact path.
 */
export function isActiveHref(pathname: string, href: string, section: boolean): boolean {
  if (!section) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
