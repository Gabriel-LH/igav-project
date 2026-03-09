import { InventoryRepository } from "../../../../domain/tenant/repositories/InventoryRepository";

interface SoftDeleteProductInput {
  productId: string;
  deletedBy: string;
}

interface ToggleVariantInput {
  variantId: string;
  isActive: boolean;
}

export class SoftDeleteProductUseCase {
  constructor(private inventoryRepo: InventoryRepository) {}

  execute(input: SoftDeleteProductInput): void {
    this.inventoryRepo.softDeleteProduct(input.productId, input.deletedBy);
  }
}

export class ToggleProductVariantUseCase {
  constructor(private inventoryRepo: InventoryRepository) {}

  execute(input: ToggleVariantInput): void {
    this.inventoryRepo.updateProductVariant(input.variantId, {
      isActive: input.isActive,
      updatedAt: new Date(),
    });
  }
}
