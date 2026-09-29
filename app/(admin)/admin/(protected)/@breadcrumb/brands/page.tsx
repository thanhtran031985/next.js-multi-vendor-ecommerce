import { Breadcrumb } from "@/components/dashboard/Breadcrumb";

export default function BrandsBreadcrumb() {
  return <Breadcrumb items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Brands" }]} />;
}
