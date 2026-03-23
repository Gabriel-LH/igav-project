import { HomeHeader } from "@/src/components/tenant/home/home-header";
import { ProductGrid } from "@/src/components/tenant/home/home-product-grid";
import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";
import {
  getAttributeTypesAction,
  getAttributeValuesAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";

export default async function HomePage() {
  const [categoriesResult, attributeTypesResult, attributeValuesResult] =
    await Promise.all([
      getCategoriesAction(),
      getAttributeTypesAction(),
      getAttributeValuesAction(),
    ]);

  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : [];
  const attributeTypes = attributeTypesResult.success
    ? (attributeTypesResult.data ?? [])
    : [];
  const attributeValues = attributeValuesResult.success
    ? (attributeValuesResult.data ?? [])
    : [];

  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <HomeHeader />
        <ProductGrid
          categories={categories}
          attributeTypes={attributeTypes}
          attributeValues={attributeValues}
        />
      </div>
    </>
  );
}
