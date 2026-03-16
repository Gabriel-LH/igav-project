import { ProductRepository } from "../../../../domain/tenant/repositories/ProductRepository";
import { Product } from "../../../../types/product/type.product";
import { ProductVariant } from "../../../../types/product/type.productVariant";

interface ListProductsWithVariantsInput {
  tenantId: string;
  includeDeleted?: boolean;
  onlySerializable?: boolean;
}

interface ListProductsWithVariantsOutput {
  products: Product[];
  variants: ProductVariant[];
}

export class ListProductsWithVariantsUseCase {
  constructor(private readonly productRepo: ProductRepository) {}

  async execute(
    input: ListProductsWithVariantsInput,
  ): Promise<ListProductsWithVariantsOutput> {
    const products = await this.productRepo.getProductsByTenant(input.tenantId, {
      includeDeleted: input.includeDeleted,
    });

    const filteredProducts = products.filter((product) =>
      typeof input.onlySerializable === "boolean"
        ? product.is_serial === input.onlySerializable
        : true,
    );

    const variants = await this.productRepo.getVariantsByTenant(input.tenantId);

    // Filter variants to only include those belonging to the filtered products
    const productIds = new Set(filteredProducts.map((p) => p.id));
    const filteredVariants = variants.filter((v) => productIds.has(v.productId));

    return { products: filteredProducts, variants: filteredVariants };
  }
}
