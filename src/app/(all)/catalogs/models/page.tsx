import { ModelHeader } from "@/src/components/inventory/catalogs/model/model-header";
import { ModelLayout } from "@/src/components/inventory/catalogs/model/model-layout";

export default function ModelsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <ModelHeader />
      <ModelLayout />
    </div>
  );
}
