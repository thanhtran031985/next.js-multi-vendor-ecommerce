// URLs of the brand list (/admin/brands?q=&status=&page=&pageSize=). Shared by the server page
// (pagination, "clear filters") and the client toolbar. Default values are left out so the
// URL stays short: page 1, page size 10, no search, all statuses.

import { BRAND_DEFAULT_PAGE_SIZE, type BrandStatusValue } from "@/lib/brands/schema";

export const BRANDS_PATH = "/admin/brands";

export type BrandListUrlState = {
  q?: string;
  status?: BrandStatusValue;
  page?: number;
  pageSize?: number;
};

export function brandListHref({ q, status, page, pageSize }: BrandListUrlState): string {
  const params = new URLSearchParams();
  const query = q?.trim();
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  if (pageSize && pageSize !== BRAND_DEFAULT_PAGE_SIZE) params.set("pageSize", String(pageSize));
  const search = params.toString();
  return search ? `${BRANDS_PATH}?${search}` : BRANDS_PATH;
}

export function brandDetailHref(id: string): string {
  return `${BRANDS_PATH}/${id}`;
}
