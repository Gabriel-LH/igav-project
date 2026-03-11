import { CategoryHeader } from "@/src/components/tenant/inventory/catalogs/category/category-header";
import { CategoryLayout } from "@/src/components/tenant/inventory/catalogs/category/category-layout";
import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";

export default async function CategoriesPage() {
  const result = await getCategoriesAction();
  const categories = result.success ? (result.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <CategoryHeader />
      <CategoryLayout initialCategories={categories} />
    </div>
  );
}
