import { StockLot } from "../../../types/product/type.stockLote";
import { InventoryItem } from "../../../types/product/type.inventoryItem";

export interface StockRepository {
  /**
   * Adds a new stock lot (bulk inventory)
   */
  addStockLot(lot: Partial<StockLot> & { tenantId: string }): Promise<StockLot>;

  /**
   * Adds multiple serialized inventory items
   */
  addInventoryItems(items: (Partial<InventoryItem> & { tenantId: string })[]): Promise<InventoryItem[]>;

  /**
   * Gets all stock lots for a specific variant
   */
  getLotsByVariant(variantId: string): Promise<StockLot[]>;

  /**
   * Gets all serialized items for a specific variant
   */
  getItemsByVariant(variantId: string): Promise<InventoryItem[]>;

  /**
   * Gets stock summary for a product (all variants)
   */
  getStockSummaryByProduct(productId: string): Promise<{
    variantId: string;
    totalQuantity: number;
    serializedCount: number;
  }[]>;
}
