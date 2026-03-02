import { BrandHeader } from "@/src/components/inventory/catalogs/brand/brand-header";
import { BrandLayout } from "@/src/components/inventory/catalogs/brand/brand-layout";

export default function BrandPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <BrandHeader />
      <BrandLayout />
    </div>
  );
}
