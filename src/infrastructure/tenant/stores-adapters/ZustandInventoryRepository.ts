import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { StockLot } from "@/src/types/product/type.stockLote";
import { InventoryItem } from "@/src/types/product/type.inventoryItem";
import { InventoryItemStatus } from "@/src/utils/status-type/InventoryItemStatusType";

export class ZustandInventoryRepository implements InventoryRepository {
  async updateItemStatus(
    stockId: string,
    status: InventoryItemStatus | string,
    branchId?: string,
    sellerId?: string,
  ): Promise<void> {
    useInventoryStore
      .getState()
      .updateItemStatus(stockId, status as any, branchId, sellerId);
  }

  async decreaseLotQuantity(stockId: string, quantity: number): Promise<void> {
    useInventoryStore.getState().decreaseLotQuantity(stockId, quantity);
  }

  async increaseLotQuantity(stockId: string, quantity: number): Promise<void> {
    useInventoryStore.getState().increaseLotQuantity(stockId, quantity);
  }

  async isSerial(stockId: string): Promise<boolean> {
    const items = useInventoryStore.getState().inventoryItems;
    return items.some((i) => i.id === stockId);
  }

  async getTenantIdByProductId(productId: string): Promise<string | null> {
    const products = useInventoryStore.getState().products;
    return products.find((p) => p.id === productId)?.tenantId || null;
  }

  async getTenantIdByStockId(stockId: string): Promise<string | null> {
    const items = useInventoryStore.getState().inventoryItems;
    const item = items.find((i) => i.id === stockId);
    if (item) return item.tenantId;

    const lots = useInventoryStore.getState().stockLots;
    const lot = lots.find((l) => l.id === stockId);
    if (lot) return lot.tenantId;

    return null;
  }

  async getProducts(): Promise<Product[]> {
    return useInventoryStore.getState().products;
  }

  async getProductVariants(): Promise<ProductVariant[]> {
    return useInventoryStore.getState().productVariants;
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return useInventoryStore.getState().inventoryItems;
  }

  async getStockLots(): Promise<StockLot[]> {
    return useInventoryStore.getState().stockLots;
  }

  async getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
    return useInventoryStore.getState().inventoryItems.find((i) => i.id === id);
  }

  async getStockLotByIdOrVariant(
    idOrVariant: string,
  ): Promise<StockLot | undefined> {
    return useInventoryStore
      .getState()
      .stockLots.find(
        (l) => l.id === idOrVariant || l.variantId === idOrVariant,
      );
  }

  async addProduct(product: Product): Promise<void> {
    useInventoryStore.getState().addProduct(product);
  }

  async updateProduct(
    productId: string,
    updates: Partial<Product>,
  ): Promise<void> {
    useInventoryStore.getState().updateProduct(productId, updates);
  }

  async softDeleteProduct(
    productId: string,
    deletedBy?: string,
  ): Promise<void> {
    useInventoryStore.getState().softDeleteProduct(productId, deletedBy);
  }

  async addProductVariants(variants: ProductVariant[]): Promise<void> {
    useInventoryStore.getState().addProductVariants(variants);
  }

  async updateProductVariant(
    variantId: string,
    updates: Partial<ProductVariant>,
  ): Promise<void> {
    useInventoryStore.getState().updateProductVariant(variantId, updates);
  }

  async addStockLot(stockLot: StockLot): Promise<void> {
    useInventoryStore.getState().addStockLot(stockLot);
  }

  async removeStockLot(stockLotId: string): Promise<void> {
    useInventoryStore.getState().removeStockLot(stockLotId);
  }

  async addInventoryItems(items: InventoryItem[]): Promise<void> {
    useInventoryStore.getState().addInventoryItems(items);
  }

  async removeInventoryItem(itemId: string): Promise<void> {
    useInventoryStore.getState().removeInventoryItem(itemId);
  }
}
