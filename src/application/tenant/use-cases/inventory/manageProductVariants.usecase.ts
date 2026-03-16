import { ProductRepository } from "../../../../domain/tenant/repositories/ProductRepository";

interface SoftDeleteProductInput {
  productId: string;
  deletedBy: string;
}

interface ToggleVariantInput {
  variantId: string;
  isActive: boolean;
}

interface UpdateVariantInput {
  variantId: string;
  updates: Partial<{
    variantCode: string;
    barcode: string;
    purchasePrice: number;
    priceSell: number;
    priceRent: number;
    rentUnit: "hora" | "día" | "semana" | "mes" | "evento";
    image: string[];
    isActive: boolean;
  }>;
}

export class SoftDeleteProductUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(input: SoftDeleteProductInput): Promise<void> {
    await this.productRepo.softDeleteProduct(input.productId, input.deletedBy);
  }
}

export class ToggleProductVariantUseCase {
  constructor(private productRepo: ProductRepository) { }

  async execute(input: ToggleVariantInput): Promise<void> {
    await this.productRepo.updateVariant(input.variantId, {
      isActive: input.isActive,
      updatedAt: new Date(),
    });
  }
}

export class UpdateVariantUseCase {
  constructor(private productRepo: ProductRepository) { }

  async execute(input: UpdateVariantInput): Promise<void> {
    await this.productRepo.updateVariant(input.variantId, {
      ...input.updates,
      updatedAt: new Date(),
    });
  }
}
