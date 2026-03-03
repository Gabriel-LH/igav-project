import { ProductDetailsPage } from "@/src/components/home/product-details-page";

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

  return (
    <ProductDetailsPage
      lookup={decodeURIComponent(resolvedParams.lookup)}
      initialVariantId={resolvedSearchParams?.variantId}
    />
  );
}
