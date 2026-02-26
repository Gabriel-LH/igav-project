import { Promotion } from "@/src/types/promotion/type.promotion";

export function resolveCouponPromotion(
  code: string,
  promotions: Promotion[],
  now: Date,
): Promotion | null {
  return (
    promotions.find((promo) => {
      if (!promo.requiresCode) return false;
      if (!promo.code) return false;
      if (promo.code.toLowerCase() !== code.toLowerCase()) return false;
      if (!promo.isActive) return false;
      if (promo.startDate > now) return false;
      if (promo.endDate && promo.endDate < now) return false;
      if (promo.maxUses && promo.usedCount >= promo.maxUses) return false;
      return true;
    }) ?? null
  );
}
