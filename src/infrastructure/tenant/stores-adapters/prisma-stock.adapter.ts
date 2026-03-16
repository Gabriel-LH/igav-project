import { StockRepository } from "../../../domain/tenant/repositories/StockRepository";
import { StockLot } from "../../../types/product/type.stockLote";
import { InventoryItem } from "../../../types/product/type.inventoryItem";
import prisma from "@/src/lib/prisma";

export class PrismaStockAdapter implements StockRepository {
  private prisma = prisma;

  async addStockLot(lot: Partial<StockLot> & { tenantId: string }): Promise<StockLot> {
    const created = await this.prisma.stockLot.create({
      data: {
        id: lot.id,
        tenantId: lot.tenantId,
        productId: lot.productId!,
        variantId: lot.variantId!,
        branchId: lot.branchId!,
        quantity: lot.quantity ?? 0,
        barcode: lot.barcode,
        expirationDate: lot.expirationDate,
        lotNumber: lot.lotNumber,
        isForRent: lot.isForRent ?? false,
        isForSale: lot.isForSale ?? false,
        condition: lot.condition as any,
        status: (lot.status || "en_transito") as any,
      },
    });

    return {
      ...created,
      condition: created.condition as any,
      status: created.status as any,
    } as unknown as StockLot;
  }

  async addInventoryItems(items: (Partial<InventoryItem> & { tenantId: string })[]): Promise<InventoryItem[]> {
    // We use createMany for efficiency but it doesn't return the objects in some versions
    // or we can use a transaction with multiple creates if we need the IDs back immediately.
    // For simplicity and since we want to return them, we can use a transaction or just createMany and then fetch.
    
    const results = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.inventoryItem.create({
          data: {
            id: item.id,
            tenantId: item.tenantId,
            productId: item.productId!,
            variantId: item.variantId!,
            branchId: item.branchId!,
            serialCode: item.serialCode!,
            isForRent: item.isForRent ?? false,
            isForSale: item.isForSale ?? false,
            condition: item.condition as any,
            status: (item.status || "en_transito") as any,
            damageNotes: item.damageNotes,
          },
        })
      )
    );

    return results.map(r => ({
      ...r,
      condition: r.condition as any,
      status: r.status as any,
    })) as unknown as InventoryItem[];
  }

  async getLotsByVariant(variantId: string): Promise<StockLot[]> {
    const lots = await this.prisma.stockLot.findMany({
      where: { variantId },
      orderBy: { createdAt: "desc" },
    });

    return lots.map(l => ({
      ...l,
      condition: l.condition as any,
      status: l.status as any,
    })) as unknown as StockLot[];
  }

  async getItemsByVariant(variantId: string): Promise<InventoryItem[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { variantId },
      orderBy: { createdAt: "desc" },
    });

    return items.map(i => ({
      ...i,
      condition: i.condition as any,
      status: i.status as any,
    })) as unknown as InventoryItem[];
  }

  async getStockSummaryByProduct(productId: string): Promise<{
    variantId: string;
    totalQuantity: number;
    serializedCount: number;
  }[]> {
    // This could be optimized into a single raw query or using groupBy
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });

    const summary = await Promise.all(
      variants.map(async (v) => {
        const lotSum = await this.prisma.stockLot.aggregate({
          where: { variantId: v.id },
          _sum: { quantity: true },
        });

        const itemCount = await this.prisma.inventoryItem.count({
          where: { variantId: v.id },
        });

        return {
          variantId: v.id,
          totalQuantity: lotSum._sum.quantity || 0,
          serializedCount: itemCount,
        };
      })
    );

    return summary;
  }
}
