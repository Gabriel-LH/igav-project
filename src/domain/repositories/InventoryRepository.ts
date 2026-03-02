import { InventoryItemStatus } from "../../utils/status-type/InventoryItemStatusType";
import { Product } from "../../types/product/type.product";
import { ProductVariant } from "../../types/product/type.productVariant";
import { StockLot } from "../../types/product/type.stockLote";
import { InventoryItem } from "../../types/product/type.inventoryItem";

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
  getProductVariants(): any[];
  getInventoryItems(): any[];
  getStockLots(): any[];
  getInventoryItemById(id: string): any;
  getStockLotByIdOrVariant(idOrVariant: string): any;
  addProduct(product: Product): void;
  updateProduct(productId: string, updates: Partial<Product>): void;
  softDeleteProduct(productId: string, deletedBy?: string): void;
  addProductVariants(variants: ProductVariant[]): void;
  updateProductVariant(
    variantId: string,
    updates: Partial<ProductVariant>,
  ): void;
  addStockLot(stockLot: StockLot): void;
  removeStockLot(stockLotId: string): void;
  addInventoryItems(items: InventoryItem[]): void;
  removeInventoryItem(itemId: string): void;
}
