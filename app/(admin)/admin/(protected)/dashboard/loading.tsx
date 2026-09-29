/** Loading state of the admin dashboard (AdminDashboard mockup "Loading"). */
export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-5.5" aria-busy="true" aria-label="Loading dashboard">
      <div>
        <div className="skeleton h-6.5 w-60 max-w-full rounded-xs" />
        <div className="skeleton mt-3 h-3.5 w-90 max-w-full rounded-xs" />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-24 rounded-lg" />
        ))}
      </div>
      <div className="skeleton h-50 rounded-xl" />
      <div className="skeleton h-85 rounded-xl" />
    </div>
  );
}
