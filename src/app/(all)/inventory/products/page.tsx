import { ProductsHeader } from "@/src/components/inventory/inventory/products/product-header";
import { ProductsLayout } from "@/src/components/inventory/inventory/products/product-layout";

export default function Page() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <ProductsHeader />
      <ProductsLayout />
    </div>
  );
}