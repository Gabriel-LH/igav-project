import { BrandHeader } from "@/src/components/tenant/inventory/catalogs/brand/brand-header";
import { BrandLayout } from "@/src/components/tenant/inventory/catalogs/brand/brand-layout";
import { getBrandsAction } from "@/src/app/(tenant)/tenant/actions/brand.actions";

export default async function BrandPage() {
  const result = await getBrandsAction();
  const brands = result.success ? (result.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <BrandHeader />
      <BrandLayout initialBrands={brands} />
    </div>
  );
}
