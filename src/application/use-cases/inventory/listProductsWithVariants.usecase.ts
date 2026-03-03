import { InventoryRepository } from "../../../domain/repositories/InventoryRepository";
import { Product } from "../../../types/product/type.product";
import { ProductVariant } from "../../../types/product/type.productVariant";

interface ListProductsWithVariantsInput {
  includeDeleted?: boolean;
  onlySerializable?: boolean;
}

interface ListProductsWithVariantsOutput {
  products: Product[];
  variants: ProductVariant[];
}

export class ListProductsWithVariantsUseCase {
  constructor(private readonly inventoryRepo: InventoryRepository) {}

  execute(
    input: ListProductsWithVariantsInput = {},
  ): ListProductsWithVariantsOutput {
    const includeDeleted = input.includeDeleted ?? false;

    const products = this.inventoryRepo
      .getProducts()
      .filter((product) => includeDeleted || !product.isDeleted)
      .filter((product) =>
        typeof input.onlySerializable === "boolean"
          ? product.is_serial === input.onlySerializable
          : true,
      );

    const productIds = new Set(products.map((product) => product.id));
    const variants = this.inventoryRepo
      .getProductVariants()
      .filter((variant) => productIds.has(variant.productId));

    return { products, variants };
  }
}
