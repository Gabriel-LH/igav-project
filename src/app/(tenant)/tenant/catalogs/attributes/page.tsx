import { AttributesHeader } from "@/src/components/tenant/inventory/catalogs/attributes-type/attributes-header";
import { AttributesLayout } from "@/src/components/tenant/inventory/catalogs/attributes-type/attributes-layout";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AttributesHeader />
      <AttributesLayout />
    </div>
  );
}
