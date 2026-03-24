import { PromotionRepository } from "../../../../domain/tenant/repositories/PromotionRepository";

export class TogglePromotionUseCase {
  constructor(private promotionRepository: PromotionRepository) {}

  async execute(promotionId: string, isActive: boolean): Promise<void> {
    await this.promotionRepository.togglePromotion(promotionId, isActive);
  }
}
