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

  async getLotsByTenant(tenantId: string): Promise<StockLot[]> {
    const lots = await this.prisma.stockLot.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return lots.map(l => ({
      ...l,
      condition: l.condition as any,
      status: l.status as any,
    })) as unknown as StockLot[];
  }

  async getItemsByTenant(tenantId: string): Promise<InventoryItem[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return items.map(i => ({
      ...i,
      condition: i.condition as any,
      status: i.status as any,
    })) as unknown as InventoryItem[];
  }

  async getLotById(stockLotId: string): Promise<StockLot | null> {
    const lot = await this.prisma.stockLot.findUnique({
      where: { id: stockLotId },
    });
    if (!lot) return null;
    return {
      ...lot,
      condition: lot.condition as any,
      status: lot.status as any,
    } as unknown as StockLot;
  }

  async findAvailableLotLike(lot: StockLot): Promise<StockLot | null> {
    const found = await this.prisma.stockLot.findFirst({
      where: {
        tenantId: lot.tenantId,
        productId: lot.productId,
        variantId: lot.variantId,
        branchId: lot.branchId,
        status: "disponible",
        barcode: lot.barcode ?? null,
        lotNumber: lot.lotNumber ?? null,
        condition: lot.condition as any,
        isForRent: lot.isForRent,
        isForSale: lot.isForSale,
        expirationDate: lot.expirationDate ?? null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!found) return null;
    return {
      ...found,
      condition: found.condition as any,
      status: found.status as any,
    } as unknown as StockLot;
  }

  async updateStockLotQuantity(
    stockLotId: string,
    quantity: number,
  ): Promise<StockLot> {
    const updated = await this.prisma.stockLot.update({
      where: { id: stockLotId },
      data: { quantity },
    });

    return {
      ...updated,
      condition: updated.condition as any,
      status: updated.status as any,
    } as unknown as StockLot;
  }

  async updateStockLotStatus(
    stockLotId: string,
    status: StockLot["status"],
  ): Promise<StockLot> {
    const updated = await this.prisma.stockLot.update({
      where: { id: stockLotId },
      data: { status: status as any },
    });

    return {
      ...updated,
      condition: updated.condition as any,
      status: updated.status as any,
    } as unknown as StockLot;
  }

  async deleteStockLot(stockLotId: string): Promise<void> {
    await this.prisma.stockLot.delete({
      where: { id: stockLotId },
    });
  }

  async updateInventoryItemStatus(
    itemId: string,
    status: InventoryItem["status"],
  ): Promise<InventoryItem> {
    const updated = await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: { status: status as any },
    });

    return {
      ...updated,
      condition: updated.condition as any,
      status: updated.status as any,
    } as unknown as InventoryItem;
  }

  async addStockMovement(input: {
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
  }): Promise<void> {
    await this.prisma.stockMovement.create({
      data: {
        tenantId: input.tenantId,
        stockLotId: input.stockLotId,
        type: input.type as any,
        quantity: input.quantity,
        reason: input.reason,
        operationId: input.operationId,
        changedBy: input.changedBy,
      },
    });
  }
}
