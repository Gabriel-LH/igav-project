import { AttributesHeader } from "@/src/components/inventory/catalogs/attribute-value/attribute-header";
import { AttributeValueLayout } from "@/src/components/inventory/catalogs/attribute-value/attribute-layout";

export default function AttributeValuePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <AttributesHeader />
      <AttributeValueLayout />
    </div>
  );
};
