/** Loading state of /admin/brands (VendorProductList mockup "Loading": shimmering rows). */
export default function BrandsLoading() {
  return (
    <div aria-busy="true" aria-label="Loading brands">
      <div className="mb-5.5 flex items-center gap-3">
        <div className="skeleton size-9 rounded-md" />
        <div className="skeleton h-6 w-32 rounded-xs" />
        <div className="skeleton h-6.5 w-10 rounded-full" />
      </div>
      <div className="rounded-xl border border-line-soft bg-surface px-6 py-5.5 shadow-xs">
        <div className="mb-5 flex flex-wrap gap-3.5">
          <div className="skeleton h-11.5 min-w-60 flex-1 rounded-md" />
          <div className="skeleton h-11.5 w-40 rounded-md" />
          <div className="skeleton h-11.5 w-32 rounded-md" />
          <div className="skeleton h-11.5 w-34 rounded-md" />
        </div>
        <div className="overflow-hidden rounded-lg border border-line-soft">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-field px-4.5 py-4 first:border-t-0">
              <div className="skeleton size-11.5 flex-none rounded-md" />
              <div className="skeleton h-3 flex-1 rounded-xs" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
