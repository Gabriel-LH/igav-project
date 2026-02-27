import { InventoryItemStatus } from "../../utils/status-type/InventoryItemStatusType";

export interface InventoryRepository {
  updateItemStatus(
    stockId: string,
    status: InventoryItemStatus | string,
    branchId?: string,
    sellerId?: string,
  ): void;
  decreaseLotQuantity(stockId: string, quantity: number): void;
  increaseLotQuantity(stockId: string, quantity: number): void;
  isSerial(stockId: string): boolean;
  getTenantIdByProductId(productId: string): string | null;
  getTenantIdByStockId(stockId: string): string | null;
  getProducts(): any[];
  getInventoryItems(): any[];
  getStockLots(): any[];
  getInventoryItemById(id: string): any;
  getStockLotByIdOrVariant(idOrVariant: string): any;
}
