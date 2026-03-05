import { HomeHeader } from "@/src/components/tenant/home/home-header";
import { ProductGrid } from "@/src/components/tenant/home/home-product-grid";

export default function HomePage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <HomeHeader />
        <ProductGrid />
      </div>
    </>
  );
}
