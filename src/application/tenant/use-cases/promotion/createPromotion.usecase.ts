import { Promotion } from "../../../../types/promotion/type.promotion";
import { PromotionRepository } from "../../../../domain/tenant/repositories/PromotionRepository";

export class CreatePromotionUseCase {
  constructor(private promotionRepository: PromotionRepository) {}

  async execute(params: {
    tenantId: string;
    userId: string;
    promotion: Omit<Promotion, "id" | "tenantId" | "createdAt" | "createdBy">;
  }): Promise<Promotion> {
    const { tenantId, userId, promotion } = params;

    const newPromotion: Promotion = {
      ...promotion,
      id: crypto.randomUUID(),
      tenantId,
      createdAt: new Date(),
      createdBy: userId,
      usedCount: 0,
      isActive: promotion.isActive ?? true,
    } as Promotion;

    await this.promotionRepository.createPromotion(newPromotion);

    return newPromotion;
  }
}
