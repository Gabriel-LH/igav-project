// promotion.service.ts

import { PROMOTIONS_MOCK } from "@/src/mocks/mock.promotions";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import { promotionSchema } from "@/src/types/promotion/type.promotion";

const isPromotionActiveAtDate = (startDate: Date, endDate?: Date, now = new Date()) => {
  if (startDate > now) return false;
  if (endDate && endDate < now) return false;
  return true;
};

export function ensurePromotionsLoaded() {
  const state = usePromotionStore.getState();
  if (state.isHydrated) return;

  const validatedPromotions = PROMOTIONS_MOCK.flatMap((promotion) => {
    const result = promotionSchema.safeParse(promotion);
    return result.success ? [result.data] : [];
  });

  state.setPromotions(validatedPromotions);
}

export function getActivePromotions() {
  ensurePromotionsLoaded();
  return usePromotionStore
    .getState()
    .promotions.filter(
      (promotion) =>
        promotion.isActive &&
        isPromotionActiveAtDate(promotion.startDate, promotion.endDate),
    );
}
