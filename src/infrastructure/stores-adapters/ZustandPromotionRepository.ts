import { PromotionRepository } from "../../domain/repositories/PromotionRepository";
import { usePromotionStore } from "../../store/usePromotionStore";
import { Promotion } from "../../types/promotion/type.promotion";

export class ZustandPromotionRepository implements PromotionRepository {
  setPromotions(promotions: Promotion[]): void {
    usePromotionStore.getState().setPromotions(promotions);
  }

  getPromotions(): Promotion[] {
    return usePromotionStore.getState().promotions;
  }

  getIsHydrated(): boolean {
    return usePromotionStore.getState().isHydrated;
  }
}
