import { ProductDetailsPage } from "@/src/components/tenant/home/product-details-page";
import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";
import {
  getAttributeTypesAction,
  getAttributeValuesAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";

interface ProductDetailsRouteProps {
  params: Promise<{
    lookup: string;
  }>;
  searchParams?: Promise<{
    variantId?: string;
  }>;
}

export default async function ProductDetailsRoute({
  params,
  searchParams,
}: ProductDetailsRouteProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

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
    <ProductDetailsPage
      lookup={decodeURIComponent(resolvedParams.lookup)}
      initialVariantId={resolvedSearchParams?.variantId}
      categories={categories}
      attributeTypes={attributeTypes}
      attributeValues={attributeValues}
    />
  );
}
