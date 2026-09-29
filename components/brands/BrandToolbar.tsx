"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { Select } from "@/components/ui/Select";
import { brandListHref, type BrandListUrlState } from "@/lib/brands/list-url";
import { BRAND_NAME_MAX, BRAND_PAGE_SIZES, type BrandStatusValue } from "@/lib/brands/schema";

type BrandToolbarProps = {
  /** Current URL state (already parsed and normalised on the server). */
  q: string;
  status?: BrandStatusValue;
  pageSize: number;
  /** "Add Brand" button, rendered at the end of the row. */
  action?: ReactNode;
};

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search (debounced), status filter and rows-per-page for /admin/brands. The URL is the only
 * list state: every change replaces it and goes back to page 1; the server page re-renders.
 */
export function BrandToolbar({ q: urlQ, status, pageSize, action }: BrandToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(urlQ);
  // The last query this toolbar put in the URL. When the URL's q changes to something else
  // (back/forward, "Clear filters"), the input follows it; our own debounced updates arriving
  // late must not overwrite what the user has typed since.
  const [pushedQ, setPushedQ] = useState(urlQ);
  const [seenUrlQ, setSeenUrlQ] = useState(urlQ);
  if (urlQ !== seenUrlQ) {
    setSeenUrlQ(urlQ);
    if (urlQ !== pushedQ) {
      setQ(urlQ);
      setPushedQ(urlQ);
    }
  }

  function go(changes: BrandListUrlState) {
    const next = { q: q.trim(), status, pageSize, ...changes, page: 1 };
    setPushedQ(next.q ?? "");
    startTransition(() => router.replace(brandListHref(next), { scroll: false }));
  }

  useEffect(() => {
    const next = q.trim();
    if (next === pushedQ) return;
    const timer = setTimeout(() => {
      setPushedQ(next);
      startTransition(() => router.replace(brandListHref({ q: next, status, pageSize }), { scroll: false }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [q, pushedQ, status, pageSize, router]);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3.5" aria-busy={pending}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: q.trim() });
        }}
        className="flex h-11.5 min-w-60 flex-1 items-center overflow-hidden rounded-md border border-line bg-field transition-shadow focus-within:border-iris-500 focus-within:ring-3 focus-within:ring-iris-100"
      >
        <span className="px-3.5 text-muted-soft">
          <SearchIcon size={18} />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={BRAND_NAME_MAX}
          placeholder="Search by brand name"
          aria-label="Search brands by name"
          className="h-full min-w-0 flex-1 bg-transparent px-1 text-13-5 leading-none text-ink outline-none"
        />
        <button
          type="submit"
          className="h-full cursor-pointer bg-iris-500 px-5.5 text-13 leading-none font-semibold text-white transition-colors hover:bg-iris-600 focus-visible:bg-iris-600 focus-visible:outline-none"
        >
          Search
        </button>
      </form>

      <Select
        key={`status-${status ?? "all"}`}
        aria-label="Filter by status"
        defaultValue={status ?? ""}
        onChange={(e) => go({ status: (e.target.value || undefined) as BrandStatusValue | undefined })}
        className="w-40"
      >
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </Select>

      <Select
        key={`size-${pageSize}`}
        aria-label="Rows per page"
        defaultValue={String(pageSize)}
        onChange={(e) => go({ pageSize: Number(e.target.value) })}
        className="w-32"
      >
        {BRAND_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size} / page
          </option>
        ))}
      </Select>

      {action}
    </div>
  );
}
