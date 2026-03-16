import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";
import { CatalogTabContent } from "./catalog-tab-content";
import {
  getModelsAction,
  getBrandsAction,
} from "@/src/app/(tenant)/tenant/actions/brand.actions";
import {
  getAttributeTypesAction,
  getAttributeValuesAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";

export async function CatalogConfigLayout() {
  const [
    modelsResult,
    brandsResult,
    categoriesResult,
    attributeTypesResult,
    attributeValuesResult,
  ] = await Promise.all([
    getModelsAction(),
    getBrandsAction(),
    getCategoriesAction(),
    getAttributeTypesAction(),
    getAttributeValuesAction(),
  ]);

  const models = modelsResult.success ? (modelsResult.data ?? []) : [];
  const brands = brandsResult.success ? (brandsResult.data ?? []) : [];
  const categories = categoriesResult.success
    ? (categoriesResult.data ?? [])
    : [];
  const attributeTypes = attributeTypesResult.success
    ? (attributeTypesResult.data ?? [])
    : [];
  const attributeValues = attributeValuesResult.success
    ? (attributeValuesResult.data ?? [])
    : [];

  return (
    <div>
      <CatalogTabContent
        initialBrands={brands}
        initialModels={models}
        initialCategories={categories}
        initialAttributeTypes={attributeTypes}
        initialAttributeValues={attributeValues}
      />
    </div>
  );
}
