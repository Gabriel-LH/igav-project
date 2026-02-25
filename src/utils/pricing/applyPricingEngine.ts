import { BusinessRules } from "@/src/types/bussines-rules/bussines-rules";
import { CartOperationType } from "@/src/types/cart/type.cart";
import { Product } from "@/src/types/product/type.product";
import { Promotion } from "@/src/types/promotion/type.promotion";

export interface ApplyPricingEngineInput {
  product: Product;
  operationType: CartOperationType;
  listPrice: number;
  promotions: Promotion[];
  businessRules: BusinessRules;
  manualDiscountAmount?: number;
  manualDiscountReason?: string;
  explicitBundle?: {
    promotionId: string;
    bundleId: string;
    priceAtMoment: number;
  };
}

export interface ApplyPricingEngineResult {
  listPrice: number;
  priceAtMoment: number;
  discountAmount: number;
  discountReason?: string;
  promotionId?: string;
  bundleId?: string;
  requiresAdminAuth: boolean;
}

const roundToCents = (value: number) => Math.round(value * 100) / 100;

const isPromotionActive = (promotion: Promotion, now = new Date()) => {
  if (!promotion.isActive) return false;
  if (promotion.startDate > now) return false;
  if (promotion.endDate && promotion.endDate < now) return false;
  return true;
};

const appliesToProduct = (promotion: Promotion, product: Product) => {
  if (promotion.scope === "global") return true;
  if (promotion.scope === "category") {
    return promotion.targetIds?.includes(product.categoryId) ?? false;
  }
  if (promotion.scope === "product_specific") {
    return promotion.targetIds?.includes(product.id) ?? false;
  }
  return false;
};

const calculatePromotionDiscount = (
  listPrice: number,
  promotion: Promotion,
): number => {
  if (promotion.type === "percentage") {
    const percent = promotion.value ?? 0;
    return listPrice * (percent / 100);
  }
  if (promotion.type === "fixed_amount") {
    return promotion.value ?? 0;
  }
  return 0;
};

export function applyPricingEngine(
  input: ApplyPricingEngineInput,
): ApplyPricingEngineResult {
  const {
    product,
    listPrice,
    operationType,
    promotions,
    businessRules,
    manualDiscountAmount = 0,
    manualDiscountReason,
    explicitBundle,
  } = input;

  const safeListPrice = Math.max(0, listPrice);

  if (explicitBundle) {
    const bundlePrice = Math.max(0, explicitBundle.priceAtMoment);
    const bundleDiscount = Math.max(0, safeListPrice - bundlePrice);
    return {
      listPrice: safeListPrice,
      priceAtMoment: roundToCents(bundlePrice),
      discountAmount: roundToCents(bundleDiscount),
      discountReason: manualDiscountReason,
      promotionId: explicitBundle.promotionId,
      bundleId: explicitBundle.bundleId,
      requiresAdminAuth: false,
    };
  }

  const activePromotions = promotions
    .filter((promotion) => isPromotionActive(promotion))
    .filter((promotion) => appliesToProduct(promotion, product))
    .filter((promotion) => {
      if (operationType === "venta") return product.can_sell;
      return product.can_rent;
    });

  const bestPromotion = activePromotions.reduce<Promotion | null>(
    (best, current) => {
      if (!best) return current;
      const bestDiscount = calculatePromotionDiscount(safeListPrice, best);
      const currentDiscount = calculatePromotionDiscount(safeListPrice, current);
      return currentDiscount > bestDiscount ? current : best;
    },
    null,
  );

  const isExclusive = bestPromotion?.isExclusive ?? false;
  const promotionDiscount = bestPromotion
    ? calculatePromotionDiscount(safeListPrice, bestPromotion)
    : 0;

  const allowPromotionAndManual =
    !isExclusive && businessRules.allowStackingDiscounts;

  const desiredManualDiscount = allowPromotionAndManual
    ? manualDiscountAmount
    : bestPromotion
      ? 0
      : manualDiscountAmount;

  const maxManualDiscount = safeListPrice * businessRules.maxDiscountPercentageAllowed;
  const boundedManualDiscount = Math.min(Math.max(0, desiredManualDiscount), maxManualDiscount);

  const requiresAdminAuth =
    safeListPrice > 0 &&
    boundedManualDiscount / safeListPrice >
      businessRules.requireAdminAuthForDiscountOver;

  const totalDiscount = Math.min(
    safeListPrice,
    Math.max(0, promotionDiscount) + boundedManualDiscount,
  );
  const finalPrice = Math.max(0, safeListPrice - totalDiscount);

  return {
    listPrice: safeListPrice,
    priceAtMoment: roundToCents(finalPrice),
    discountAmount: roundToCents(totalDiscount),
    discountReason:
      bestPromotion?.name ??
      (boundedManualDiscount > 0 ? manualDiscountReason : undefined),
    promotionId: bestPromotion?.id,
    requiresAdminAuth,
  };
}
