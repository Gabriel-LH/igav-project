// promotion.use-case.ts

import { CartItem } from "@/src/types/cart/type.cart";
import { Promotion } from "@/src/types/promotion/type.promotion";
import { calculateBestPromotionForProduct } from "@/src/utils/promotion/promotio.engine";

interface PromotionContext {
  branchId: string;
  cartSubtotal: number;
  now: Date;
  operationType?: "venta" | "alquiler";
}

export function applyPromotionsUseCase(
  items: CartItem[],
  promotions: Promotion[],
  context: PromotionContext,
): CartItem[] {
  const validPromotions = promotions.filter((promo) => {
    if (!promo.isActive) return false;
    if (promo.startDate && new Date(promo.startDate) > context.now)
      return false;
    if (promo.endDate && new Date(promo.endDate) < context.now) return false;

    if (promo.branchIds?.length && !promo.branchIds.includes(context.branchId))
      return false;

    if (
      promo.minPurchaseAmount &&
      context.cartSubtotal < promo.minPurchaseAmount
    )
      return false;

    if (promo.maxUses && promo.usedCount >= promo.maxUses) return false;

    return true;
  });

  return items.map((item) => {
    if (item.bundleId) return item; // no tocar bundles

    const applicablePromotions = validPromotions.filter((promo) =>
      promo.appliesTo.includes(item.operationType),
    );

    const basePrice = Math.max(0, item.listPrice ?? item.unitPrice);
    const result = calculateBestPromotionForProduct(
      item.product,
      basePrice,
      applicablePromotions,
    );

    return {
      ...item,
      unitPrice: result.finalPrice,
      discountAmount: result.discount,
      appliedPromotionId: result.promotionId,
      discountReason: result.reason ?? undefined,
    };
  });
}
