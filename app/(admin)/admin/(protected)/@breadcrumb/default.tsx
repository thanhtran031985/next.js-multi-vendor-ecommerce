import { Breadcrumb, DASHBOARD_CRUMBS } from "@/components/dashboard/Breadcrumb";

/** Slot fallback on a full page load of a route without its own breadcrumb page. */
export default function DefaultBreadcrumb() {
  return <Breadcrumb items={DASHBOARD_CRUMBS} />;
}
