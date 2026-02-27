import { Promotion } from "../../types/promotion/type.promotion";

export interface PromotionRepository {
  setPromotions(promotions: Promotion[]): void;
  getPromotions(): Promotion[];
  getIsHydrated(): boolean;
}
