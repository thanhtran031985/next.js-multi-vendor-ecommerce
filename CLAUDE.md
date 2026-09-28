# CLAUDE.md — Covet Marketplace (Next.js)

Persistent instructions for working in this repo. Read `DESIGN_SYSTEM.md` before writing
any UI — it is the single source of truth for tokens and components.

## What this is
Covet is a **multi-vendor e-commerce marketplace** (many independent sellers, one
storefront, one checkout — like Etsy/Amazon). Three audiences share one design language:
**Storefront** (shoppers), **Customer dashboard**, **Seller/Vendor dashboard**, and
**Admin dashboard**.

The visual design already exists as static HTML mockups (the `.dc.html` files this was
exported from). Your job is to make it a **functional Next.js app** — real routing, data,
forms, auth, cart, and API calls — while reproducing that design exactly via the tokens in
`DESIGN_SYSTEM.md`.

## Stack
- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** — all tokens from `DESIGN_SYSTEM.md` live in `globals.css` `:root` and
  `tailwind.config.ts`. Never hardcode a hex, font size, radius, or shadow in a component.
- **shadcn/ui** for primitives (Button, Card, Badge, Tabs, Table, Dialog, Select, Input,
  DropdownMenu, Switch, Skeleton, Avatar). Restyle them to the tokens once, in the shared
  component, not per-usage.
- **lucide-react** for all icons.
- **react-chartjs-2 + chart.js** for charts.
- Fonts via `next/font/google`: **Sora** (display/headings/prices) + **Instrument Sans**
  (body/UI). Never Inter/Roboto/Arial.

## Golden rules (do not break)
1. **Tokens only.** If a value isn't a token, add it to `DESIGN_SYSTEM.md` first.
2. **Marketplace rules:** every product shows its **seller**; carts **group by seller**;
   orders **split by seller**; sellers see **only their own data**. Enforce the last one on
   the server (scope every seller query by the authenticated vendor id) — never trust the client.
3. **Four states everywhere:** default / loading (skeleton) / empty / error. No bare
   spinners, no blank screens. Use `loading.tsx` + `error.tsx` and skeletons.
4. **Do NOT build:** Auctions, Publication House/Authors/Creators, chat-with-vendor
   (use the **AI support agent** instead), Cash on Delivery (**Stripe-only**), Google Maps
   address picker, currency/language switchers.
5. **Real content**, no lorem ipsum, no emoji in UI.

## Architecture
- **App Router** with route groups per audience:
  `app/(storefront)/…`, `app/(account)/dashboard/…`, `app/(seller)/vendor/…`,
  `app/(admin)/admin/…`. Each group owns its layout shell (see §9 of the design system).
- **Server Components by default.** Use Client Components only for interactivity
  (hover mega-menu, cart popover, toggles, charts, forms, tabs). Mark with `"use client"`.
- **Data:** Server Components fetch directly; mutations via **Server Actions** or route
  handlers under `app/api/…`. Validate all input with **zod**. Type everything.
- **Auth:** role-based — `customer` | `vendor` | `admin`. Gate route groups in middleware /
  layout. Vendor & admin areas require the matching role.
- **State:** cart & wishlist in a client store (Context or Zustand) hydrated from the
  server; persist cart server-side for logged-in users.
- **Payments:** Stripe only (Checkout / PaymentIntents). No COD code paths.

## Component conventions
- Shared UI in `components/ui/*` (shadcn) and `components/*` (composed: `ProductCard`,
  `SellerHeader`, `StatCard`, `StatusBadge`, `DataTable`, `MegaMenu`, `CartPopover`,
  `DashboardSidebar`, `IconRail`, `Topbar`, `EmptyState`, `ErrorState`, `TableSkeleton`).
- `ProductCard` props must include `seller` and render the seller line — make it required.
- `StatusBadge` maps a status string → the correct status token pair (see design system §2):
  Paid/Delivered/Approved/Active/In-Stock→success; Pending/Packaging/Out-for-delivery/
  Soon-Stock-Out→warning; Canceled/Failed/Rejected/Unpaid/Out-of-Stock→error;
  Confirmed/Shipped/Open/Returned→info.
- Hover panels (mega-menu, cart, profile menu) use a **padding bridge** (padding on the
  wrapper, not margin) so the pointer reaches the panel without it closing.
- Tables: wrap in `overflow-x-auto` with a `min-width` inner container.

## Workflow
- Match the existing mockups' layout, density, and section order exactly; upgrade only to
  the tokens (never invent colors/spacing).
- Prefer editing over rewriting. Keep changes scoped to what's asked.
- Run `pnpm lint` / `pnpm typecheck` (or the repo's scripts) before considering a task done.
- Keep this file and `DESIGN_SYSTEM.md` updated when conventions or tokens change.

## Commands
_(fill in the repo's real scripts)_
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint / typecheck / test: `pnpm lint` · `pnpm typecheck` · `pnpm test`
