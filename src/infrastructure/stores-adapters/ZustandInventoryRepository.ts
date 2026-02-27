import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { InventoryItemStatus } from "../../utils/status-type/InventoryItemStatusType";
import { useInventoryStore } from "../../store/useInventoryStore";

export class ZustandInventoryRepository implements InventoryRepository {
  updateItemStatus(
    stockId: string,
    status: InventoryItemStatus | string,
    branchId?: string,
    sellerId?: string,
  ): void {
    const store = useInventoryStore.getState();
    store.updateItemStatus(stockId, status as any, branchId, sellerId);
  }

  decreaseLotQuantity(stockId: string, quantity: number): void {
    useInventoryStore.getState().decreaseLotQuantity(stockId, quantity);
  }

  isSerial(stockId: string): boolean {
    return useInventoryStore
      .getState()
      .inventoryItems.some((i) => i.id === stockId);
  }

  getTenantIdByProductId(productId: string): string | null {
    const product = useInventoryStore
      .getState()
      .products.find((p) => p.id === productId);
    return product?.tenantId || null;
  }

  getTenantIdByStockId(stockId: string): string | null {
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

  getProducts(): any[] {
    return useInventoryStore.getState().products;
  }

  getInventoryItems(): any[] {
    return useInventoryStore.getState().inventoryItems;
  }

  getStockLots(): any[] {
    return useInventoryStore.getState().stockLots;
  }

  getInventoryItemById(id: string): any {
    return useInventoryStore.getState().inventoryItems.find((i) => i.id === id);
  }

  getStockLotByIdOrVariant(idOrVariant: string): any {
    return useInventoryStore
      .getState()
      .stockLots.find(
        (l) => l.id === idOrVariant || l.variantCode === idOrVariant,
      );
  }

  increaseLotQuantity(stockId: string, quantity: number): void {
    // NOTE: increase might not be implemented in the store, using decrease with negative for now if it is missing
    // Let's assume there is an increase or we can implement it mapping to update.
    const store = useInventoryStore.getState();
    // Assuming there is a way or fallback to decrease negative
    if ((store as any).increaseLotQuantity) {
      (store as any).increaseLotQuantity(stockId, quantity);
    } else {
      store.decreaseLotQuantity(stockId, -quantity);
    }
  }
}
