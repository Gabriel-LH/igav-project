import { ProductsHeader } from "@/src/components/tenant/inventory/inventory/products/product-header";
import { ProductsLayout } from "@/src/components/tenant/inventory/inventory/products/product-layout";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6 min-w-0 w-full">
      <ProductsHeader />
      <ProductsLayout />
    </div>
  );
}
