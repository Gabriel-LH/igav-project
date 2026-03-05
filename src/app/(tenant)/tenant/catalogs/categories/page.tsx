import { CategoryHeader } from "@/src/components/tenant/inventory/catalogs/category/category-header";
import { CategoryLayout } from "@/src/components/tenant/inventory/catalogs/category/category-layout";

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <CategoryHeader />
      <CategoryLayout />
    </div>
  );
}
