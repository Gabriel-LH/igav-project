import { CatalogConfigHeader } from "@/src/components/tenant/inventory/inventory/catalog-config/catalog-config-header";
import { CatalogConfigLayout } from "@/src/components/tenant/inventory/inventory/catalog-config/catalog-config-layout";

export default async function CatalogConfigPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <CatalogConfigHeader />
      <CatalogConfigLayout />
    </div>
  );
}
