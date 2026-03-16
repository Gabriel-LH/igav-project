import { ProductRepository } from "../../../../domain/tenant/repositories/ProductRepository";
import { Product } from "../../../../types/product/type.product";
import { ProductVariant } from "../../../../types/product/type.productVariant";

interface GetProductByIdInput {
  tenantId: string;
  productId: string;
}

interface GetProductByIdOutput {
  product: Product;
  variants: ProductVariant[];
}

export class GetProductByIdUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(input: GetProductByIdInput): Promise<GetProductByIdOutput> {
    const product = await this.productRepo.getProductById(
      input.tenantId,
      input.productId,
    );
    if (!product) {
      throw new Error("Producto no encontrado");
    }

    const variants = await this.productRepo.getVariantsByProductId(input.productId);

    return { product, variants };
  }
}
