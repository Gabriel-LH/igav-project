import { DEFAULT_TENANT_CONFIG, DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { CartOperationType } from "@/src/types/cart/type.cart";
import { Product } from "@/src/types/product/type.product";
import { Promotion } from "@/src/types/promotion/type.promotion";
import { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

export interface ApplyPricingEngineInput {
  product: Product;
  operationType: CartOperationType;
  listPrice: number;
  promotions: Promotion[];
  config: TenantConfig;
  policy?: TenantPolicy | null;
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
    return (
      (product.categoryId && promotion.targetIds?.includes(product.categoryId)) ??
      false
    );
  }
  if (promotion.scope === "product_specific") {
    return promotion.targetIds?.includes(product.id) ?? false;
  }
  return false;
};

const calculatePromotionDiscount = (listPrice: number, promotion: Promotion): number => {
  if (promotion.type === "percentage") {
    const percent = promotion.value ?? 0;
    return listPrice * (percent / 100);
  }
  if (promotion.type === "fixed_amount") {
    return promotion.value ?? 0;
  }
  return 0;
};

const buildFallbackPolicy = (): TenantPolicy =>
  ({
    id: "default",
    tenantId: "default",
    version: 1,
    isActive: true,
    createdAt: new Date(),
    updatedBy: "system",
    ...DEFAULT_TENANT_POLICY_SECTIONS,
  }) as TenantPolicy;

export function applyPricingEngine(input: ApplyPricingEngineInput): ApplyPricingEngineResult {
  const {
    product,
    listPrice,
    operationType,
    promotions,
    config,
    policy,
    manualDiscountAmount = 0,
    manualDiscountReason,
    explicitBundle,
  } = input;

  const safeConfig = config || (DEFAULT_TENANT_CONFIG as TenantConfig);
  const safePolicy = policy ?? buildFallbackPolicy();
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
    .filter(() => {
      if (operationType === "venta") return product.can_sell;
      return product.can_rent;
    });

  const bestPromotion = activePromotions.reduce<Promotion | null>((best, current) => {
    if (!best) return current;
    const bestDiscount = calculatePromotionDiscount(safeListPrice, best);
    const currentDiscount = calculatePromotionDiscount(safeListPrice, current);
    return currentDiscount > bestDiscount ? current : best;
  }, null);

  const isExclusive = bestPromotion?.isExclusive ?? false;
  const promotionDiscount = bestPromotion
    ? calculatePromotionDiscount(safeListPrice, bestPromotion)
    : 0;

  const allowPromotionAndManual =
    !isExclusive && safeConfig.pricing.allowDiscountStacking;

  const desiredManualDiscount = allowPromotionAndManual
    ? manualDiscountAmount
    : bestPromotion
      ? 0
      : manualDiscountAmount;

  const maxManualDiscount =
    safeListPrice * (safeConfig.pricing.maxDiscountLimit / 100);
  const boundedManualDiscount = Math.min(
    Math.max(0, desiredManualDiscount),
    maxManualDiscount,
  );
  const discountPercent =
    safeListPrice > 0
      ? roundToCents((boundedManualDiscount / safeListPrice) * 100)
      : 0;

  const requiresAdminAuth =
    safeConfig.pricing.requirePinForHighDiscount &&
    safeListPrice > 0 &&
    discountPercent >= safeConfig.pricing.highDiscountThreshold;

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
    bundleId: undefined,
    requiresAdminAuth,
  };
}
