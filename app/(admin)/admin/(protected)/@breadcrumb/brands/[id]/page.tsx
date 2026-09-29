import { Breadcrumb } from "@/components/dashboard/Breadcrumb";
import { getBrandById } from "@/lib/brands/queries";

export default async function BrandDetailBreadcrumb({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await getBrandById(id);
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
