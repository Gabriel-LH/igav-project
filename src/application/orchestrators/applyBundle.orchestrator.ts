import {
  BundleDomainService,
  BundleDefinition,
} from "../../domain/services/bundle.service";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { PromotionRepository } from "../../domain/repositories/PromotionRepository";
import { CartItem } from "../../types/cart/type.cart";
import { AvailabilityInput } from "../../domain/services/bundle.service";

export class ApplyBundleOrchestrator {
  private bundleDomainService: BundleDomainService;

  constructor(
    private inventoryRepo: InventoryRepository,
    private promotionRepo: PromotionRepository,
    // Note: Business Rules repository could be added here later
  ) {
    this.bundleDomainService = new BundleDomainService();
  }

  getBundleDefinitions(tenantId?: string): BundleDefinition[] {
    const promotions = this.promotionRepo.getPromotions();
    const products = this.inventoryRepo.getProducts();

    return this.bundleDomainService.createBundleDefinitionsFromPromotions(
      promotions,
      products,
      tenantId,
    );
  }

  applyBundle(
    cart: CartItem[],
    bundleDefinition: BundleDefinition,
    tenantId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const promotions = this.promotionRepo.getPromotions();
    const inventoryItems = this.inventoryRepo.getInventoryItems();
    const stockLots = this.inventoryRepo.getStockLots();

    // In a real scenario, this would come from a BusinessRuleRepository
    const businessRules: any[] = [];

    return this.bundleDomainService.applyBundleToCart(
      cart,
      bundleDefinition,
      tenantId,
      branchId,
      startDate,
      endDate,
      promotions,
      businessRules,
      inventoryItems,
      stockLots,
      // Optional: Pass an override for checkAvailability if needed
    );
  }

  async reserveBundledItems(
    cart: CartItem[],
    tenantId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const grouped = new Map<string, { item: CartItem; quantity: number }>();

    cart
      .filter((item) => item.bundleId && item.product.tenantId === tenantId)
      .forEach((item) => {
        const key = [
          item.bundleId,
          item.product.id,
          item.operationType,
          item.selectedSizeId ?? "",
          item.selectedColorId ?? "",
        ].join("::");

        const current = grouped.get(key);
        if (!current) {
          grouped.set(key, { item, quantity: item.quantity });
        } else {
          current.quantity += item.quantity;
        }
      });

    for (const { item, quantity } of grouped.values()) {
      await this.reserveStockUsingInventory({
        productId: item.product.id,
        branchId,
        startDate,
        endDate,
        quantity,
        operationType: item.operationType,
        sizeId: item.selectedSizeId,
        colorId: item.selectedColorId,
      });
    }
  }

  private async reserveStockUsingInventory(
    input: AvailabilityInput,
  ): Promise<void> {
    const products = this.inventoryRepo.getProducts();
    const expectedTenantId = products.find(
      (p) => p.id === input.productId,
    )?.tenantId;

    if (!expectedTenantId) return;
    let remaining = input.quantity;

    const serialCandidates = this.inventoryRepo
      .getInventoryItems()
      .filter(
        (item) =>
          item.productId === input.productId &&
          item.tenantId === expectedTenantId &&
          item.branchId === input.branchId &&
          item.status === "disponible" &&
          (!input.sizeId || item.sizeId === input.sizeId) &&
          (!input.colorId || item.colorId === input.colorId),
      );

    for (const serial of serialCandidates) {
      if (remaining <= 0) break;
      this.inventoryRepo.updateItemStatus(
        serial.id,
        "reservado",
        input.branchId,
      );
      remaining -= 1;
    }

    if (remaining <= 0) return;

    const lotCandidates = this.inventoryRepo
      .getStockLots()
      .filter(
        (lot) =>
          lot.productId === input.productId &&
          products.some(
            (p) => p.id === lot.productId && p.tenantId === expectedTenantId,
          ) &&
          lot.branchId === input.branchId &&
          lot.status === "disponible" &&
          (!input.sizeId || lot.sizeId === input.sizeId) &&
          (!input.colorId || lot.colorId === input.colorId),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const lot of lotCandidates) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, lot.quantity);
      if (take > 0) {
        this.inventoryRepo.decreaseLotQuantity(lot.id, take);
        remaining -= take;
      }
    }
  }

  // Similar implementation for releaseStockUsingInventory could be added if needed
}
