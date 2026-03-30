import { PromotionRepository } from "../repositories/PromotionRepository";

import { promotionSchema } from "../../../types/promotion/type.promotion";

export class PromotionLoaderService {
  constructor(private promotionRepo: PromotionRepository) {}

  ensurePromotionsLoaded() {
    if (this.promotionRepo.getIsHydrated()) return;

    const validatedPromotions: any[] = [];

    this.promotionRepo.setPromotions(validatedPromotions);
  }
}
