import { SerializedHeader } from "@/src/components/tenant/inventory/inventory/serialized-items/serialized-header";
import { SerializedLayout } from "@/src/components/tenant/inventory/inventory/serialized-items/serialized-layout";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; variantId?: string }>;
}) {
  const { productId, variantId } = await searchParams;

  return (
    <div className="flex flex-col gap-6 p-6">
      <SerializedHeader />
      <SerializedLayout initialProductId={productId} initialVariantId={variantId} />
    </div>
  );
}
