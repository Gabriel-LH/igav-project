import { SaleRepository } from "@/src/domain/tenant/repositories/SaleRepository";
import { Sale } from "@/src/types/sales/type.sale";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { PrismaClient, Prisma, SaleStatus } from "@/prisma/generated/client";

export class PrismaSaleRepository implements SaleRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addSale(sale: Sale, saleItems: SaleItem[], discountsApplied?: any[]): Promise<void> {
    const saleItemData = await Promise.all(
      saleItems.map(async (item) => {
        const resolvedIds = await this.resolveSaleItemIds(item);

        return {
          id: item.id,
          tenantId: sale.tenantId,
          saleId: sale.id,
          productId: item.productId,
          variantId: item.variantId,
          stockId: resolvedIds.stockId,
          inventoryItemId: resolvedIds.inventoryItemId,
          quantity: Math.max(1, Number(item.quantity ?? 1)),
          priceAtMoment: Number(item.priceAtMoment ?? 0),
          listPrice: item.listPrice ?? null,
          discountAmount: Number(item.discountAmount ?? 0),
          discountReason: item.discountReason ?? null,
          bundleId: item.bundleId ?? null,
          promotionId: item.promotionId ?? null,
          productName: item.productName ?? null,
          variantCode: item.variantCode ?? null,
          serialCode: item.serialCode ?? null,
          isSerial: item.isSerial ?? Boolean(resolvedIds.inventoryItemId),
          isReturned: item.isReturned ?? false,
          returnedAt: item.returnedAt ?? null,
          returnCondition: item.returnCondition ?? null,
        };
      }),
    );

    await this.prisma.sale.create({
      data: {
        id: sale.id,
        tenantId: sale.tenantId,
        operationId: sale.operationId,
        branchId: sale.branchId,
        sellerId: sale.sellerId,
        customerId: sale.customerId || null,
        reservationId: sale.reservationId || null,
        totalAmount: sale.totalAmount,
        subTotal: sale.subTotal || 0,
        totalDiscount: sale.totalDiscount || 0,
        saleDate: sale.saleDate,
        status: sale.status as SaleStatus,
        amountRefunded: sale.amountRefunded || 0,
        notes: sale.notes || "",
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      },
    });

    if ((this.prisma as any).discountApplied) {
      await (this.prisma as any).discountApplied.updateMany({
        where: {
          operationId: sale.operationId,
          saleId: null,
          rentalId: null,
        },
        data: {
          saleId: sale.id,
        },
      });
    }

    if (saleItemData.length > 0) {
      await this.prisma.saleItem.createMany({
        data: saleItemData,
      });

      await this.addSaleItemStatusHistory(
        saleItems.map((item) => ({
          tenantId: sale.tenantId,
          saleItemId: item.id,
          fromStatus: this.resolveInitialSaleItemStatus(sale.status),
          toStatus: this.resolveInitialSaleItemStatus(sale.status),
          reason: "CREATED",
          changedBy: sale.updatedBy ?? sale.createdBy ?? sale.sellerId,
          createdAt: sale.createdAt,
        })),
      );
    }

    if (discountsApplied && discountsApplied.length > 0) {
      if ((this.prisma as any).discountApplied) {
        await (this.prisma as any).discountApplied.createMany({
          data: discountsApplied.map((d) => ({
            id: d.id,
            tenantId: sale.tenantId,
            operationId: sale.operationId,
            saleId: sale.id,
            saleItemId: d.saleItemId || null,
            amount: d.amount,
            reason: d.reason,
            promotionId: d.promotionId || null,
            description: d.description || null,
            createdAt: d.createdAt || new Date(),
          })),
        });
      } else {
        console.warn("Prisma warning: discountApplied model not found on client in PrismaSaleRepository.");
      }
    }
  }

  async getSaleById(id: string): Promise<Sale | undefined> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
    });
    return sale as unknown as Sale;
  }

  async getSaleWithItems(id: string): Promise<{ items: SaleItem[] } & Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!sale) return undefined as any;

    return {
      ...(sale as unknown as Sale),
      items: (sale as any).items.map((item: any) => ({
        ...item,
        stockId: item.stockId || item.inventoryItemId,
      })),
    } as any;
  }

  async getSales(): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      orderBy: { saleDate: "desc" },
    });
    return sales as unknown as Sale[];
  }

  async getSaleItems(): Promise<SaleItem[]> {
    const items = await this.prisma.saleItem.findMany();
    return items as unknown as SaleItem[];
  }

  async updateSale(id: string, data: Partial<Sale>): Promise<void> {
    await this.prisma.sale.update({
      where: { id },
      data: {
        ...(data as any),
        status: data.status ? (data.status as SaleStatus) : undefined,
      },
    });
  }

  async updateSaleItem(id: string, data: Partial<SaleItem>): Promise<void> {
    await this.prisma.saleItem.update({
      where: { id },
      data: {
        ...(data as any),
      },
    });
  }

  async getSaleByOperationId(operationId: string): Promise<Sale | undefined> {
    const sale = await this.prisma.sale.findFirst({
      where: { operationId },
    });
    return sale as unknown as Sale;
  }

  // legacy helper if needed
  async updateStatus(id: string, status: SaleStatus): Promise<void> {
    await this.updateSale(id, { status: status as any });
  }

  async addSaleItemStatusHistory(entries: Array<{
    tenantId: string;
    saleItemId: string;
    fromStatus: string;
    toStatus: string;
    reason?: string;
    changedBy?: string;
    createdAt?: Date;
  }>): Promise<void> {
    if (!entries.length) return;

    await (this.prisma as any).saleItemStatusHistory.createMany({
      data: entries.map((entry) => ({
        id: crypto.randomUUID(),
        tenantId: entry.tenantId,
        saleItemId: entry.saleItemId,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        reason: entry.reason ?? null,
        changedBy: entry.changedBy ?? null,
        createdAt: entry.createdAt ?? new Date(),
      })),
    });
  }

  private async resolveSaleItemIds(item: SaleItem): Promise<{
    inventoryItemId: string | null;
    stockId: string | null;
  }> {
    if (item.inventoryItemId || item.stockId) {
      return {
        inventoryItemId: item.inventoryItemId ?? null,
        stockId: item.stockId ?? null,
      };
    }

    return {
      inventoryItemId: null,
      stockId: null,
    };
  }

  private resolveInitialSaleItemStatus(status: Sale["status"]): string {
    if (status === "pendiente_pago") return "pendiente_pago";
    if (status === "reservado") return "reservado";
    if (status === "vendido_pendiente_entrega") return "vendido_pendiente_entrega";
    if (status === "cancelado") return "cancelado";
    if (status === "baja") return "baja";
    if (status === "devuelto") return "devuelto";
    return "vendido";
  }
}
