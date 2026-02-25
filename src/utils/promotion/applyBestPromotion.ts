import { Product } from "@/src/types/product/type.product";
import { Promotion } from "@/src/types/promotion/type.promotion";

export const applyBestPromotion = (
  product: Product,
  price: number,
  activePromotions: Promotion[],
) => {
  // Filtramos promociones que apliquen a este producto
  const validPromos = activePromotions.filter((promo) => {
    if (promo.scope === "global") return true;
    if (promo.scope === "category") {
      return promo.targetIds?.includes(product.categoryId) ?? false;
    }
    if (promo.scope === "product_specific") {
      return promo.targetIds?.includes(product.id) ?? false;
    }
    return false;
  });

  if (validPromos.length === 0) {
    return { finalPrice: price, discount: 0, reason: null, promotionId: undefined };
  }

  // Buscamos el mejor descuento para el cliente
  let bestPrice = price;
  let bestPromoName = "";
  let bestPromotionId: string | undefined;

  validPromos.forEach((promo) => {
    let currentDiscount = 0;
    if (promo.type === "percentage") {
      currentDiscount = price * ((promo.value ?? 0) / 100);
    } else if (promo.type === "fixed_amount") {
      currentDiscount = promo.value ?? 0;
    } else {
      return;
    }

    const newPrice = Math.max(0, price - currentDiscount);
    if (newPrice < bestPrice) {
      bestPrice = newPrice;
      bestPromoName = promo.name;
      bestPromotionId = promo.id;
    }
  });

  return {
    finalPrice: bestPrice,
    discount: price - bestPrice,
    reason: bestPromoName,
    promotionId: bestPromotionId,
  };
};
