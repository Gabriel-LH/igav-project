import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { Product } from "@/src/types/product/type.product";
import { ProductVariant } from "@/src/types/product/type.productVariant";
import { StockLot } from "@/src/types/product/type.stockLote";
import { InventoryItem } from "@/src/types/product/type.inventoryItem";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async updateItemStatus(
    stockId: string,
    status: string,
    branchId?: string,
    sellerId?: string,
  ): Promise<void> {
    await this.prisma.inventoryItem.update({
      where: { id: stockId },
      data: { status: status as any },
    });
  }

  async decreaseLotQuantity(stockId: string, quantity: number): Promise<void> {
    const lot = await this.prisma.stockLot.findUnique({
      where: { id: stockId },
    });
    if (!lot) throw new Error("StockLot not found");
    if (lot.quantity < quantity) {
      throw new Error("Not enough quantity in stock lot");
    }

    await this.prisma.stockLot.update({
      where: { id: stockId },
      data: {
        quantity: lot.quantity - quantity,
      },
    });
  }

  async increaseLotQuantity(stockId: string, quantity: number): Promise<void> {
    await this.prisma.stockLot.update({
      where: { id: stockId },
      data: {
        quantity: { increment: quantity },
      },
    });
  }

  async isSerial(stockId: string): Promise<boolean> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: stockId },
    });
    return !!item;
  }

  async getTenantIdByProductId(productId: string): Promise<string | null> {
    const prod = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { tenantId: true },
    });
    return prod?.tenantId || null;
  }

  async getTenantIdByStockId(stockId: string): Promise<string | null> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: stockId },
      select: { tenantId: true },
    });
    if (item) return item.tenantId;
    const lot = await this.prisma.stockLot.findUnique({
      where: { id: stockId },
      select: { tenantId: true },
    });
    return lot?.tenantId || null;
  }

  async getProducts(): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { isDeleted: false },
    });
    return products as unknown as Product[];
  }

  async getProductVariants(): Promise<ProductVariant[]> {
    const variants = await this.prisma.productVariant.findMany();
    return variants as unknown as ProductVariant[];
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    const items = await this.prisma.inventoryItem.findMany();
    return items as unknown as InventoryItem[];
  }

  async getStockLots(): Promise<StockLot[]> {
    const lots = await this.prisma.stockLot.findMany();
    return lots as unknown as StockLot[];
  }
  async getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
    return undefined;
  }
  async getStockLotByIdOrVariant(idOrVariant: string): Promise<StockLot | undefined> {
    return undefined;
  }
  async addProduct(product: Product): Promise<void> {}
  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {}
  async softDeleteProduct(productId: string, deletedBy?: string): Promise<void> {}
  async addProductVariants(variants: ProductVariant[]): Promise<void> {}
  async updateProductVariant(variantId: string, updates: Partial<ProductVariant>): Promise<void> {}
  async addStockLot(stockLot: StockLot): Promise<void> {}
  async removeStockLot(stockLotId: string): Promise<void> {}
  async addInventoryItems(items: InventoryItem[]): Promise<void> {}
  async removeInventoryItem(itemId: string): Promise<void> {}
}
