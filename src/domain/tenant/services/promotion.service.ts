import { differenceInDays } from "date-fns";
import { CartItem } from "../../../types/cart/type.cart";
import { Promotion } from "../../../types/promotion/type.promotion";
import { calculateBestPromotionForProduct } from "../../../utils/promotion/promotio.engine";
import { PromotionRepository } from "../repositories/PromotionRepository";
import { PromotionLoaderService } from "./promotionLoader.service";

export interface PromotionContext {
  branchId: string;
  cartSubtotal: number;
  now: Date;
  startDate?: Date;
  endDate?: Date;
  operationType?: "venta" | "alquiler";
}

export class PromotionService {
  constructor(
    private promotionRepo?: PromotionRepository,
    private promotionLoader?: PromotionLoaderService,
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
    explicitPromotions?: Promotion[],
  ) {
    if (this.promotionLoader) {
      this.promotionLoader.ensurePromotionsLoaded();
    }

    const sourcePromotions =
      explicitPromotions ||
      (this.promotionRepo ? this.promotionRepo.getPromotions() : []);

    return sourcePromotions.filter(
      (promotion) =>
        (!tenantId || !promotion?.tenantId || promotion.tenantId === tenantId) &&
        usageTypes.includes(promotion.usageType ?? "automatic") &&
        promotion.isActive &&
        this.isPromotionActiveAtDate(promotion.startDate, promotion.endDate),
    );
  }

  private calculateRentalMultiplier(
    item: CartItem,
    startDate?: Date,
    endDate?: Date
  ): number {
    if (item.operationType !== "alquiler" || !startDate || !endDate) return 1;
    // Note: If we had access to productVariants here we could check rentUnit === 'evento'
    // To be safe, we'll assume days if dates are present.
    return Math.max(differenceInDays(endDate, startDate), 1);
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

      const multiplier = this.calculateRentalMultiplier(item, context.startDate, context.endDate);
      const price = Number(result.finalPrice || 0);
      const qty = Number(item.quantity || 0);
      const rawSubtotal = price * qty * multiplier;
      const subtotal = isNaN(rawSubtotal) ? 0 : rawSubtotal;

      return {
        ...item,
        unitPrice: price,
        discountAmount: result.discount || 0,
        appliedPromotionId: result.promotionId,
        discountReason: result.reason ?? undefined,
        subtotal: Math.round(subtotal * 100) / 100,
      };
    });
  }
}
