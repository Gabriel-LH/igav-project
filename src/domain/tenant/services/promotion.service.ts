import { differenceInDays } from "date-fns";
import { CartItem } from "../../../types/cart/type.cart";
import { Promotion } from "../../../types/promotion/type.promotion";
import { calculateBestPromotionForProduct } from "../../../utils/promotion/promotio.engine";
import { PromotionRepository } from "../repositories/PromotionRepository";
import { PromotionLoaderService } from "./promotionLoader.service";
import { calculateChargeableDays } from "../../../utils/date/calculateRentalDays";
import { RentalsPolicy } from "../../../types/tenant/type.tenantPolicy";

export interface PromotionContext {
  branchId: string;
  cartSubtotal: number;
  now: Date;
  startDate?: Date;
  endDate?: Date;
  operationType?: "venta" | "alquiler";
  rentalsPolicy?: RentalsPolicy | null;
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
    context: PromotionContext
  ): number {
    if (item.operationType !== "alquiler" || !context.startDate || !context.endDate) return 1;
    
    return calculateChargeableDays(
      context.startDate,
      context.endDate,
      context.rentalsPolicy
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
      
      // 💡 Mejorar cálculo de descuentos fijos globales:
      // Si la promo es global y es monto fijo, prorrateamos el valor según el subtotal.
      const adjustedPromotions = applicablePromotions.map(promo => {
        if (promo.scope === "global" && promo.type === "fixed_amount" && context.cartSubtotal > 0) {
          const itemSubtotal = basePrice * item.quantity; // Subtotal base del item
          const weight = itemSubtotal / context.cartSubtotal;
          return {
            ...promo,
            value: (promo.value ?? 0) * weight,
          };
        }
        return promo;
      });

      const result = calculateBestPromotionForProduct(
        item.product,
        basePrice,
        adjustedPromotions,
      );

      const multiplier = this.calculateRentalMultiplier(item, context);
      const isFixedAmount = result.promotionType === "fixed_amount";
      
      const price = Number(result.finalPrice || 0);
      const qty = Number(item.quantity || 0);
      
      // 🔄 LÓGICA DE ALQUILER: 
      // Si el descuento es PORCENTAJE, se aplica al precio unitario (que se multiplica por días).
      // Si el descuento es MONTO FIJO, restamos el descuento AL FINAL del subtotal de ese ítem (no por día).
      let subtotal = 0;
      if (item.operationType === "alquiler" && isFixedAmount) {
        const baseSubtotal = (item.listPrice ?? item.unitPrice) * qty * multiplier;
        subtotal = Math.max(0, baseSubtotal - (result.discount || 0) * qty);
      } else {
        const rawSubtotal = price * qty * multiplier;
        subtotal = isNaN(rawSubtotal) ? 0 : rawSubtotal;
      }

      return {
        ...item,
        unitPrice: price,
        listPrice: basePrice,
        discountAmount: result.discount || 0,
        appliedPromotionId: result.promotionId,
        discountReason: result.reason ?? undefined,
        subtotal: Math.round(subtotal * 100) / 100,
      };
    });
  }
}
