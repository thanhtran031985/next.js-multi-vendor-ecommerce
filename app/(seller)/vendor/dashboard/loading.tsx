/** Loading state of the seller dashboard (vendordashboard mockup "Loading"). */
export default function VendorDashboardLoading() {
  return (
    <div className="flex flex-col gap-5.5" aria-busy="true" aria-label="Loading your dashboard">
      <div>
        <div className="skeleton h-6.5 w-72 max-w-full rounded-xs" />
        <div className="skeleton mt-3 h-3.5 w-90 max-w-full rounded-xs" />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton h-18.5 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-55 rounded-xl" />
      <div className="skeleton h-80 rounded-xl" />
    </div>
  );
}
