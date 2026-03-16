import { StockHeader } from "@/src/components/tenant/inventory/inventory/stock/stock-header";
import { StockLayout } from "@/src/components/tenant/inventory/inventory/stock/stock-layout";
import { getBranchesAction } from "../../actions/branch.actions";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; variantId?: string }>;
}) {
  const branchesResult = await getBranchesAction();
  const branches = branchesResult.data || [];
  const { productId, variantId } = await searchParams;

  return (
    <div className="flex flex-col gap-6 p-6">
      <StockHeader />
      <StockLayout 
        initialBranches={branches} 
        initialProductId={productId}
        initialVariantId={variantId}
      />
    </div>
  );
}
