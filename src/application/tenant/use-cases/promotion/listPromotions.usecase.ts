import { Promotion } from "../../../../types/promotion/type.promotion";
import { PromotionRepository } from "../../../../domain/tenant/repositories/PromotionRepository";

export class ListPromotionsUseCase {
  constructor(private promotionRepository: PromotionRepository) {}

  async execute(tenantId: string, includeInactive = false): Promise<Promotion[]> {
    return await this.promotionRepository.getPromotionsByTenant(tenantId, { includeInactive });
  }
}
