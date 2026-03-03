import { InventoryRepository } from "../../../domain/repositories/InventoryRepository";
import { StockListItem } from "../../interfaces/stock/StockListItem";

interface BranchSummary {
  id: string;
  name: string;
}

interface ListStockLotsInput {
  branches: BranchSummary[];
}

const formatVariantName = (attributes: Record<string, string>, fallback: string): string => {
  const attributeValues = Object.values(attributes);
  return attributeValues.length > 0 ? attributeValues.join(" / ") : fallback;
};

export class ListStockLotsUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  execute(input: ListStockLotsInput): StockListItem[] {
    const productsById = new Map(
      this.inventoryRepo.getProducts().map((product) => [product.id, product]),
    );
    const variantsById = new Map(
      this.inventoryRepo
        .getProductVariants()
        .map((variant) => [variant.id, variant]),
    );
    const branchesById = new Map(input.branches.map((branch) => [branch.id, branch]));

    return this.inventoryRepo.getStockLots().map((stockLot) => {
      const product = productsById.get(stockLot.productId);
      const variant = variantsById.get(stockLot.variantId);
      const branch = branchesById.get(stockLot.branchId);

      return {
        id: stockLot.id,
        productName: product?.name || stockLot.productId,
        variantName: variant
          ? formatVariantName(variant.attributes, variant.variantCode)
          : stockLot.variantId,
        variantCode: variant?.variantCode || stockLot.variantId,
        barcode: stockLot.barcode || variant?.barcode || "",
        branchName: branch?.name || stockLot.branchId,
        quantity: stockLot.quantity,
        status: stockLot.status,
        isForRent: stockLot.isForRent,
        isForSale: stockLot.isForSale,
        expirationDate: stockLot.expirationDate,
        lotNumber: stockLot.lotNumber,
      };
    });
  }
}
