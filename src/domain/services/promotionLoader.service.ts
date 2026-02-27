import { PromotionRepository } from "../repositories/PromotionRepository";
import { PROMOTIONS_MOCK } from "../../mocks/mock.promotions";
import { promotionSchema } from "../../types/promotion/type.promotion";

export class PromotionLoaderService {
  constructor(private promotionRepo: PromotionRepository) {}

  ensurePromotionsLoaded() {
    if (this.promotionRepo.getIsHydrated()) return;

    const validatedPromotions = PROMOTIONS_MOCK.flatMap((promotion) => {
      const result = promotionSchema.safeParse(promotion);
      return result.success ? [result.data] : [];
    });

    this.promotionRepo.setPromotions(validatedPromotions);
  }
}
