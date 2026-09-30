import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { getBrandByIdCached } from "@/lib/brands/cached";

export default async function BrandDetailBreadcrumb({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await getBrandByIdCached(id);
  return (
    <Breadcrumb
      items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Brands", href: "/admin/brands" },
        { label: brand?.name ?? "Brand" },
      ]}
    />
  );
}
