import { AttributesHeader } from "@/src/components/tenant/inventory/catalogs/attribute-value/attribute-header";
import { AttributeValueLayout } from "@/src/components/tenant/inventory/catalogs/attribute-value/attribute-layout";
import {
  getAttributeTypesAction,
  getAttributeValuesAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";

export default async function AttributeValuePage() {
  const [valuesResult, typesResult] = await Promise.all([
    getAttributeValuesAction(),
    getAttributeTypesAction(),
  ]);

  const values = valuesResult.success ? (valuesResult.data ?? []) : [];
  const types = typesResult.success ? (typesResult.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <AttributesHeader />
      <AttributeValueLayout
        initialAttributeValues={values}
        attributeTypes={types}
      />
    </div>
  );
}
