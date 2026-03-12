import { AttributesHeader } from "@/src/components/tenant/inventory/catalogs/attributes-type/attributes-header";
import { AttributesLayout } from "@/src/components/tenant/inventory/catalogs/attributes-type/attributes-layout";
import { getAttributeTypesAction } from "@/src/app/(tenant)/tenant/actions/attribute.actions";

export default async function Page() {
  const result = await getAttributeTypesAction();
  const attributeTypes = result.success ? (result.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <AttributesHeader />
      <AttributesLayout initialAttributeTypes={attributeTypes} />
    </div>
  );
}
