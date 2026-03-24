import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { InventoryItemStatus } from "../../../utils/status-type/InventoryItemStatusType";
import { useInventoryStore } from "../../../store/useInventoryStore";
import { Product } from "../../../types/product/type.product";
import { ProductVariant } from "../../../types/product/type.productVariant";
import { StockLot } from "../../../types/product/type.stockLote";
import { InventoryItem } from "../../../types/product/type.inventoryItem";

export class ZustandInventoryRepository implements InventoryRepository {
  async updateItemStatus(
    stockId: string,
    status: InventoryItemStatus | string,
    branchId?: string,
    sellerId?: string,
  ): Promise<void> {
    const store = useInventoryStore.getState();
    store.updateItemStatus(stockId, status as any, branchId, sellerId);
  }

  async decreaseLotQuantity(stockId: string, quantity: number): Promise<void> {
    useInventoryStore.getState().decreaseLotQuantity(stockId, quantity);
  }

  async isSerial(stockId: string): Promise<boolean> {
    return useInventoryStore
      .getState()
      .inventoryItems.some((i) => i.id === stockId);
  }

  async getTenantIdByProductId(productId: string): Promise<string | null> {
    const product = useInventoryStore
      .getState()
      .products.find((p) => p.id === productId);
    return product?.tenantId || null;
  }

  async getTenantIdByStockId(stockId: string): Promise<string | null> {
    const store = useInventoryStore.getState();
    const serial = store.inventoryItems.find((s) => s.id === stockId);
    if (serial?.tenantId) return serial.tenantId;

    const lot = store.stockLots.find((l) => l.id === stockId);
    if (lot) {
      const lotProduct = store.products.find((p) => p.id === lot.productId);
      if (lotProduct?.tenantId) return lotProduct.tenantId;
    }
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

  async increaseLotQuantity(stockId: string, quantity: number): Promise<void> {
    const store = useInventoryStore.getState();
    if ((store as any).increaseLotQuantity) {
      (store as any).increaseLotQuantity(stockId, quantity);
    } else {
      store.decreaseLotQuantity(stockId, -quantity);
    }
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

  async softDeleteProduct(productId: string, deletedBy?: string): Promise<void> {
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
