import {
  BundleDomainService,
  BundleDefinition,
  AvailabilityInput,
} from "../../../domain/tenant/services/bundle.service";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { PromotionRepository } from "../../../domain/tenant/repositories/PromotionRepository";
import { CartItem } from "../../../types/cart/type.cart";
import { TenantConfig } from "../../../types/tenant/type.tenantConfig";

export class ApplyBundleUseCase {
  private bundleDomainService: BundleDomainService;

  constructor(
    private inventoryRepo: InventoryRepository,
    private promotionRepo: PromotionRepository,
  ) {
    this.bundleDomainService = new BundleDomainService();
  }

  async getBundleDefinitions(tenantId?: string): Promise<BundleDefinition[]> {
    const promotions = this.promotionRepo.getPromotions();
    const products = await this.inventoryRepo.getProducts();

    return this.bundleDomainService.createBundleDefinitionsFromPromotions(
      promotions,
      products,
      tenantId,
    );
  }

  async applyBundle(
    cart: CartItem[],
    bundleDefinition: BundleDefinition,
    tenantId: string,
    branchId: string,
    startDate: Date,
    endDate: Date,
    config: TenantConfig,
  ) {
    const promotions = this.promotionRepo.getPromotions();
    const inventoryItems = await this.inventoryRepo.getInventoryItems();
    const stockLots = await this.inventoryRepo.getStockLots();
    const productVariants = await this.inventoryRepo.getProductVariants();

    return this.bundleDomainService.applyBundleToCart(
      cart,
      bundleDefinition,
      tenantId,
      branchId,
      startDate,
      endDate,
      promotions,
      config,
      inventoryItems,
      stockLots,
      productVariants,
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
          item.variantId,
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
        variantId: item.variantId,
      });
    }
  }

  private async reserveStockUsingInventory(
    input: AvailabilityInput,
  ): Promise<void> {
    const products = await this.inventoryRepo.getProducts();
    const expectedTenantId = products.find(
      (p) => p.id === input.productId,
    )?.tenantId;

    if (!expectedTenantId) return;
    let remaining = input.quantity;

    const items = await this.inventoryRepo.getInventoryItems();
    const serialCandidates = items.filter(
        (item) =>
          item.productId === input.productId &&
          item.tenantId === expectedTenantId &&
          item.branchId === input.branchId &&
          item.status === "disponible" &&
          (!input.variantId || item.variantId === input.variantId),
      );

    for (const serial of serialCandidates) {
      if (remaining <= 0) break;
      await this.inventoryRepo.updateItemStatus(
        serial.id,
        "reservado",
        input.branchId,
      );
      remaining -= 1;
    }

    if (remaining <= 0) return;

    const lots = await this.inventoryRepo.getStockLots();
    const lotCandidates = lots.filter(
        (lot) =>
          lot.productId === input.productId &&
          products.some(
            (p) => p.id === lot.productId && p.tenantId === expectedTenantId,
          ) &&
          lot.branchId === input.branchId &&
          lot.status === "disponible" &&
          (!input.variantId || lot.variantId === input.variantId),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const lot of lotCandidates) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, lot.quantity);
      if (take > 0) {
        await this.inventoryRepo.decreaseLotQuantity(lot.id, take);
        remaining -= take;
      }
    }
  }
}
