// Per-request cached brand lookup for the detail page, its breadcrumb slot and its metadata
// (three server components that all need the same row). Kept apart from queries.ts so
// scripts/verify-brands.ts (plain Node, no React server runtime) can keep importing queries.ts.

import { cache } from "react";
import { getBrandById } from "@/lib/brands/queries";

export const getBrandByIdCached = cache(getBrandById);
