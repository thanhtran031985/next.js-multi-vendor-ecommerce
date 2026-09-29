import { Breadcrumb, DASHBOARD_CRUMBS } from "@/components/dashboard/Breadcrumb";

/**
 * Any admin route without its own breadcrumb page (e.g. /admin/dashboard). Needed because on
 * client-side navigation an unmatched slot keeps showing the previous page's trail.
 */
export default function CatchAllBreadcrumb() {
  return <Breadcrumb items={DASHBOARD_CRUMBS} />;
}
