import { ModelHeader } from "@/src/components/tenant/inventory/catalogs/model/model-header";
import { ModelLayout } from "@/src/components/tenant/inventory/catalogs/model/model-layout";
import { getModelsAction, getBrandsAction } from "@/src/app/(tenant)/tenant/actions/brand.actions";

export default async function ModelsPage() {
  const [modelsResult, brandsResult] = await Promise.all([
    getModelsAction(),
    getBrandsAction(),
  ]);

  const models = modelsResult.success ? (modelsResult.data ?? []) : [];
  const brands = brandsResult.success ? (brandsResult.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <ModelHeader />
      <ModelLayout initialModels={models} initialBrands={brands} />
    </div>
  );
}
