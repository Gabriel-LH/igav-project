import { InventoryRepository } from "../../../domain/repositories/InventoryRepository";
import { SerializedListItem } from "../../interfaces/inventory/SerializedListItem";

interface BranchSummary {
  id: string;
  name: string;
}

interface ListSerializedItemsInput {
  branches: BranchSummary[];
}

const formatVariantName = (attributes: Record<string, string>, fallback: string): string => {
  const attributeValues = Object.values(attributes);
  return attributeValues.length > 0 ? attributeValues.join(" / ") : fallback;
};

export class ListSerializedItemsUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  execute(input: ListSerializedItemsInput): SerializedListItem[] {
    const productsById = new Map(
      this.inventoryRepo.getProducts().map((product) => [product.id, product]),
    );
    const variantsById = new Map(
      this.inventoryRepo
        .getProductVariants()
        .map((variant) => [variant.id, variant]),
    );
    const branchesById = new Map(input.branches.map((branch) => [branch.id, branch]));

    return this.inventoryRepo.getInventoryItems().map((item) => {
      const product = productsById.get(item.productId);
      const variant = variantsById.get(item.variantId);
      const branch = branchesById.get(item.branchId);

      return {
        id: item.id,
        serialCode: item.serialCode,
        productName: product?.name || item.productId,
        variantName: variant
          ? formatVariantName(variant.attributes, variant.variantCode)
          : item.variantId,
        variantCode: variant?.variantCode || item.variantId,
        branchName: branch?.name || item.branchId,
        condition: item.condition,
        status: item.status,
        isForRent: item.isForRent,
        isForSale: item.isForSale,
        createdAt: item.createdAt,
      };
    });
  }
}
