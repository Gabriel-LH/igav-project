import { SerializedHeader } from "@/src/components/inventory/inventory/serialized-items/serialized-header";
import { SerializedLayout } from "@/src/components/inventory/inventory/serialized-items/serialized-layout";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SerializedHeader />
      <SerializedLayout />
    </div>
  );
}
