import { CartItem } from "../../types/cart/type.cart";
import { Promotion } from "../../types/promotion/type.promotion";
import { calculateBestPromotionForProduct } from "../../utils/promotion/promotio.engine";
import { PromotionRepository } from "../repositories/PromotionRepository";
import { PromotionLoaderService } from "./promotionLoader.service";

export interface PromotionContext {
  branchId: string;
  cartSubtotal: number;
  now: Date;
  operationType?: "venta" | "alquiler";
}

export class PromotionService {
  constructor(
    private promotionRepo: PromotionRepository,
    private promotionLoader: PromotionLoaderService,
  ) {}

  private isPromotionActiveAtDate = (
    startDate: Date,
    endDate?: Date,
    now = new Date(),
  ) => {
    if (startDate > now) return false;
    if (endDate && endDate < now) return false;
    return true;
  };

  getActivePromotions(
    tenantId?: string,
    usageTypes: Array<"automatic" | "coupon" | "referral"> = ["automatic"],
  ) {
    this.promotionLoader.ensurePromotionsLoaded();
    return this.promotionRepo
      .getPromotions()
      .filter(
        (promotion) =>
          (!tenantId ||
            !promotion.tenantId ||
            promotion.tenantId === tenantId) &&
          usageTypes.includes(promotion.usageType ?? "automatic") &&
          promotion.isActive &&
          this.isPromotionActiveAtDate(promotion.startDate, promotion.endDate),
      );
  }

  applyPromotionsUseCase(
    items: CartItem[],
    promotions: Promotion[],
    context: PromotionContext,
  ): CartItem[] {
    const allowDiscountsOnBundleItems = false;

    const validPromotions = promotions.filter((promo) => {
      if (!promo.isActive) return false;
      if (promo.startDate && new Date(promo.startDate) > context.now)
        return false;
      if (promo.endDate && new Date(promo.endDate) < context.now) return false;

      if (
        promo.branchIds?.length &&
        !promo.branchIds.includes(context.branchId)
      )
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
      if (item.bundleId && !allowDiscountsOnBundleItems) return item;

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
}
