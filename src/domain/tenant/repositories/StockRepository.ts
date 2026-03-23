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
   * Gets all stock lots for a product (all variants)
   */
  getStockSummaryByProduct(productId: string): Promise<{
    variantId: string;
    totalQuantity: number;
    serializedCount: number;
  }[]>;

  /**
   * Gets all stock lots for a tenant
   */
  getLotsByTenant(tenantId: string): Promise<StockLot[]>;

  /**
   * Gets all serialized items for a tenant
   */
  getItemsByTenant(tenantId: string): Promise<InventoryItem[]>;

  /**
   * Gets a stock lot by id
   */
  getLotById(stockLotId: string): Promise<StockLot | null>;

  /**
   * Finds an available lot matching the given lot signature
   */
  findAvailableLotLike(
    lot: StockLot,
  ): Promise<StockLot | null>;

  /**
   * Updates stock lot quantity
   */
  updateStockLotQuantity(
    stockLotId: string,
    quantity: number,
  ): Promise<StockLot>;

  /**
   * Updates stock lot status
   */
  updateStockLotStatus(
    stockLotId: string,
    status: StockLot["status"],
  ): Promise<StockLot>;

  /**
   * Deletes a stock lot by id
   */
  deleteStockLot(id: string): Promise<void>;

  /**
   * Deletes a serialized inventory item by id
   */
  deleteInventoryItem(id: string): Promise<void>;

  /**
   * Updates serialized item status
   */
  updateInventoryItemStatus(
    itemId: string,
    status: InventoryItem["status"],
  ): Promise<InventoryItem>;

  /**
   * Adds a stock movement entry
   */
  addStockMovement(input: {
    tenantId: string;
    stockLotId: string;
    type:
      | "stock_inicial"
      | "recepcion_transito"
      | "recepcion_disponible"
      | "ajuste_incremento"
      | "ajuste_decremento";
    quantity: number;
    reason?: string;
    operationId?: string;
    changedBy?: string;
  }): Promise<void>;
}
