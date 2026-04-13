import { calculateChargeableDays } from "@/src/utils/date/calculateRentalDays";
import { PromotionRepository } from "../../../../domain/tenant/repositories/PromotionRepository";
import { InventoryRepository } from "../../../../domain/tenant/repositories/InventoryRepository";
import { BundleDomainService } from "../../../../domain/tenant/services/bundle.service";
import { PromotionService } from "../../../../domain/tenant/services/promotion.service";
import { CartItem } from "../../../../types/cart/type.cart";
import { TenantConfig } from "../../../../types/tenant/type.tenantConfig";
import { TenantPolicy } from "../../../../types/tenant/type.tenantPolicy";

export interface CalculateCartPromotionsInput {
  items: CartItem[];
  tenantId: string;
  branchId: string;
  startDate?: Date;
  endDate?: Date;
  config: TenantConfig;
  policy?: TenantPolicy | null;
  usageTypes?: Array<"automatic" | "coupon" | "referral">;
  couponCode?: string | null;
}

export class CalculateCartPromotionsUseCase {
  private bundleService: BundleDomainService;
  private promotionService: PromotionService;

  constructor(
    private promotionRepo: PromotionRepository,
    private inventoryRepo: InventoryRepository,
  ) {
    this.bundleService = new BundleDomainService();
    this.promotionService = new PromotionService();
  }

  async execute(input: CalculateCartPromotionsInput): Promise<{
    items: CartItem[];
    subtotal: number;
  }> {
    const { 
      items, 
      tenantId, 
      branchId, 
      startDate = new Date(), 
      endDate = new Date(), 
      config,
      policy,
      usageTypes = ["automatic"]
    } = input;

    // 1. Fetch active promotions
    const allPromotions = await this.promotionRepo.getPromotionsByTenant(tenantId);
    const promotions = allPromotions.filter(p => 
      p.isActive && 
      usageTypes.includes(p.usageType ?? "automatic") &&
      (!p.branchIds?.length || p.branchIds.includes(branchId))
    );

    // 2. Fetch necessary inventory data for bundles
    const productsRes = await this.inventoryRepo.getProducts();
    const products = productsRes.filter(p => p.tenantId === tenantId);
    
    const inventoryItemsRes = await this.inventoryRepo.getInventoryItems();
    const inventoryItems = inventoryItemsRes.filter(i => i.tenantId === tenantId);
    
    const stockLotsRes = await this.inventoryRepo.getStockLots();
    const stockLots = stockLotsRes.filter(l => l.tenantId === tenantId);
    
    const productVariantsRes = await this.inventoryRepo.getProductVariants();
    const productVariants = productVariantsRes.filter(v => products.some(p => p.id === v.productId));

    // 3. Identify and apply BUNDLES (Combos)
    const bundleDefinitions = this.bundleService.createBundleDefinitionsFromPromotions(
      promotions,
      products,
      tenantId
    );

    let finalItems = items;

    if (bundleDefinitions.length > 0) {
      // Sort bundles by discount value (best combo first)
      const sortedBundles = [...bundleDefinitions].sort((a, b) => b.discountValue - a.discountValue);

      for (const bundleDef of sortedBundles) {
        const { cart, eligibility } = this.bundleService.applyBundleToCart(
          finalItems,
          bundleDef,
          tenantId,
          branchId,
          startDate,
          endDate,
          promotions,
          config,
          policy,
          inventoryItems,
          stockLots,
          productVariants
        );
        if (eligibility.eligible) {
          finalItems = cart;
        }
      }
    }

    // 4. Apply individual promotions to the remaining items
    const cartSubtotal = finalItems.reduce((acc, item) => {
      const variant = productVariants.find(v => v.id === item.variantId);
      const isEvent = variant?.rentUnit === "evento";
      
      const days = calculateChargeableDays(startDate, endDate, policy?.rentals);
      
      const multiplier = (item.operationType === "alquiler" && !isEvent)
        ? days
        : 1;
      const price = Number(item.listPrice ?? item.unitPrice ?? 0);
      const qty = Number(item.quantity || 0);
      const rawSubtotal = price * qty * multiplier;
      return acc + (isNaN(rawSubtotal) ? 0 : rawSubtotal);
    }, 0);
    
    const processedItems = this.promotionService.applyPromotionsUseCase(
      finalItems,
      promotions,
      {
        branchId,
        cartSubtotal,
        now: new Date(),
        startDate,
        endDate,
        rentalsPolicy: policy?.rentals
      }
    );

    return {
      items: processedItems,
      subtotal: cartSubtotal,
    };
  }
}
