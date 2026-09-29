import { ProfileHeading } from "@/components/dashboard/ProfileHeading";

/** Loading state of the Profile Info card (userdashboard mockup "Loading"). */
export default function CustomerDashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading your profile">
      <ProfileHeading />
      <div className="mt-5 mb-8.5 flex flex-col items-center">
        <div className="skeleton size-30 rounded-full" />
        <div className="skeleton mt-4 h-4 w-30 rounded-xs" />
      </div>
      <div className="mx-auto grid max-w-profile gap-x-6 gap-y-5.5 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <div className="skeleton mb-2.5 h-2.75 w-[38%] rounded-xs" />
            <div className="skeleton h-12 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
