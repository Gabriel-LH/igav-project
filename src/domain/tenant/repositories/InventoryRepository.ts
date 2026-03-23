import { InventoryItemStatus } from "../../../utils/status-type/InventoryItemStatusType";
import { Product } from "../../../types/product/type.product";
import { ProductVariant } from "../../../types/product/type.productVariant";
import { StockLot } from "../../../types/product/type.stockLote";
import { InventoryItem } from "../../../types/product/type.inventoryItem";

export interface InventoryRepository {
  updateItemStatus(
    stockId: string,
    status: InventoryItemStatus | string,
    branchId?: string,
    sellerId?: string,
  ): Promise<void>;
  decreaseLotQuantity(stockId: string, quantity: number): Promise<void>;
  increaseLotQuantity(stockId: string, quantity: number): Promise<void>;
  isSerial(stockId: string): Promise<boolean>;
  getTenantIdByProductId(productId: string): Promise<string | null>;
  getTenantIdByStockId(stockId: string): Promise<string | null>;
  getProducts(): Promise<Product[]>;
  getProductVariants(): Promise<ProductVariant[]>;
  getInventoryItems(): Promise<InventoryItem[]>;
  getStockLots(): Promise<StockLot[]>;
  getInventoryItemById(id: string): Promise<InventoryItem | undefined>;
  getStockLotByIdOrVariant(idOrVariant: string): Promise<StockLot | undefined>;
  addProduct(product: Product): Promise<void>;
  updateProduct(productId: string, updates: Partial<Product>): Promise<void>;
  softDeleteProduct(productId: string, deletedBy?: string): Promise<void>;
  addProductVariants(variants: ProductVariant[]): Promise<void>;
  updateProductVariant(
    variantId: string,
    updates: Partial<ProductVariant>,
  ): Promise<void>;
  addStockLot(stockLot: StockLot): Promise<void>;
  removeStockLot(stockLotId: string): Promise<void>;
  addInventoryItems(items: InventoryItem[]): Promise<void>;
  removeInventoryItem(itemId: string): Promise<void>;
}
