import { HomeHeader } from "@/src/components/home/home-header";
import { ProductGrid } from "@/src/components/home/home-product-grid";

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
