import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** URL of a page (keeps the other list filters). */
  hrefFor: (page: number) => string;
  label?: string;
};

/**
 * Page links from the AdminProductList mockup: 34px squares, current page iris, others
 * --line-soft, right-aligned. Plain links (server-rendered, history-friendly). Long ranges
 * collapse to 1 … 4 5 6 … 20. Nothing is rendered for a single page.
 */
export function Pagination({ page, pageCount, hrefFor, label = "Pagination" }: PaginationProps) {
  if (pageCount <= 1) return null;

  const base = "inline-flex h-8.5 min-w-8.5 items-center justify-center rounded-sm px-2.5 text-13 leading-none font-semibold";
  return (
    <nav aria-label={label} className="mt-5 flex justify-end">
      <ul className="flex flex-wrap gap-1.5">
        {pageItems(page, pageCount).map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className={`${base} text-muted`}>
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span aria-current="page" className={`${base} bg-iris-500 text-white`}>
                  {item}
                </span>
              ) : (
                <Link
                  href={hrefFor(item)}
                  aria-label={`Page ${item}`}
                  className={`${base} bg-line-soft text-ink-soft transition-colors hover:bg-track hover:text-ink focus-visible:ring-3 focus-visible:ring-iris-100 focus-visible:outline-none`}
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

/** 1 … (page-1) page (page+1) … last; everything when there are 7 pages or fewer. */
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(page - 1, pageCount - 4));
  const end = Math.min(pageCount - 1, Math.max(page + 1, 5));
  const items: (number | "gap")[] = [1];
  if (start > 2) items.push("gap");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pageCount - 1) items.push("gap");
  items.push(pageCount);
  return items;
}
