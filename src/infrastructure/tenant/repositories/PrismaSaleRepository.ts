import { SaleRepository } from "@/src/domain/tenant/repositories/SaleRepository";
import { Sale } from "@/src/types/sales/type.sale";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { PrismaClient, Prisma, SaleStatus } from "@/prisma/generated/client";

export class PrismaSaleRepository implements SaleRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addSale(sale: Sale, saleItems: SaleItem[]): Promise<void> {
    const itemsData = saleItems.map((item) => {
      const data: any = {
        id: item.id,
        tenant: { connect: { id: sale.tenantId } },
        product: { connect: { id: item.productId } },
        variant: { connect: { id: item.variantId } },
        quantity: item.quantity,
        priceAtMoment: item.priceAtMoment,
        listPrice: item.listPrice ?? null,
        discountAmount: item.discountAmount ?? 0,
        discountReason: item.discountReason ?? null,
        bundleId: item.bundleId ?? null,
        isReturned: item.isReturned ?? false,
      };

      if (item.stockId) {
        data.stock = { connect: { id: item.stockId } };
      }
      if (item.inventoryItemId) {
        data.inventoryItem = { connect: { id: item.inventoryItemId } };
      }
      if (item.promotionId) {
        data.promotion = { connect: { id: item.promotionId } };
      }

      return data;
    });

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
        saleDate: sale.saleDate,
        status: sale.status as SaleStatus,
        amountRefunded: sale.amountRefunded || 0,
        notes: sale.notes || "",
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
        items: {
          create: itemsData,
        },
      },
    });
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
}
