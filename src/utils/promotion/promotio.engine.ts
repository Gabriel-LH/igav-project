// promotion.engine.ts

import { Product } from "@/src/types/product/type.product";
import { Promotion } from "@/src/types/promotion/type.promotion";

export function calculateBestPromotionForProduct(
  product: Product,
  basePrice: number,
  promotions: Promotion[],
) {
  let bestPrice = basePrice;
  let bestPromotion: Promotion | null = null;

  for (const promo of promotions) {
    if (!isEligible(product, promo)) continue;

    const discount = calculateDiscount(basePrice, promo);
    const finalPrice = Math.max(0, basePrice - discount);

    if (finalPrice < bestPrice) {
      bestPrice = finalPrice;
      bestPromotion = promo;
    }
  }

  return {
    finalPrice: bestPrice,
    discount: basePrice - bestPrice,
    promotionId: bestPromotion?.id,
    reason: bestPromotion?.name ?? null,
  };
}

function isEligible(product: Product, promo: Promotion) {
  switch (promo.scope) {
    case "global":
      return true;

    case "category":
      return promo.targetIds?.includes(product.categoryId) ?? false;

    case "product_specific":
      return promo.targetIds?.includes(product.id) ?? false;

    default:
      return false;
  }
}

function calculateDiscount(price: number, promo: Promotion) {
  if (promo.type === "percentage") {
    return price * ((promo.value ?? 0) / 100);
  }

  if (promo.type === "fixed_amount") {
    return promo.value ?? 0;
  }

  return 0;
}
