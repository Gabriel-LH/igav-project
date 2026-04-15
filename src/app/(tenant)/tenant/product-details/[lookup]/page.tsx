import { ProductDetailsViewer } from "@/src/components/tenant/home/product-details-viewer";
import { getCategoriesAction } from "@/src/app/(tenant)/tenant/actions/category.actions";
import {
  getAttributeTypesAction,
  getAttributeValuesAction,
} from "@/src/app/(tenant)/tenant/actions/attribute.actions";
import { getPromotionsAction } from "@/src/app/(tenant)/tenant/actions/promotion.actions";

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

  const [categoriesResult, attributeTypesResult, attributeValuesResult, promotionsResult] =
    await Promise.all([
      getCategoriesAction(),
      getAttributeTypesAction(),
      getAttributeValuesAction(),
      getPromotionsAction(),
    ]);

  const categories = categoriesResult.success ? (categoriesResult.data ?? []) : [];
  const attributeTypes = attributeTypesResult.success
    ? (attributeTypesResult.data ?? [])
    : [];
  const attributeValues = attributeValuesResult.success
    ? (attributeValuesResult.data ?? [])
    : [];
  const promotions = promotionsResult.success ? (promotionsResult.data ?? []) : [];

  return (
    <ProductDetailsViewer
      lookup={decodeURIComponent(resolvedParams.lookup)}
      initialVariantId={resolvedSearchParams?.variantId}
      categories={categories}
      attributeTypes={attributeTypes}
      attributeValues={attributeValues}
      initialPromotions={promotions}
    />
  );
}
