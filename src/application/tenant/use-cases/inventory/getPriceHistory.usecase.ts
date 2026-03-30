import { ProductRepository } from "../../../../domain/tenant/repositories/ProductRepository";

export class GetProductPriceHistoryUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(productId: string): Promise<any[]> {
    return this.productRepo.getPriceHistoryByProductId(productId);
  }
}
