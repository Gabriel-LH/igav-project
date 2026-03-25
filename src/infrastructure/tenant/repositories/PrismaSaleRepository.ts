import { SaleRepository } from "@/src/domain/tenant/repositories/SaleRepository";
import { Sale } from "@/src/types/sales/type.sale";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { PrismaClient, Prisma, SaleStatus, ItemCondition } from "@/prisma/generated/client";

export class PrismaSaleRepository implements SaleRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addSale(sale: Sale, saleItems: SaleItem[]): Promise<void> {
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
          create: saleItems.map((item) => ({
            id: item.id,
            tenantId: sale.tenantId,
            productId: item.productId,
            variantId: item.variantId || "",
            stockId: item.stockId,
            quantity: item.quantity,
            priceAtMoment: item.priceAtMoment,
            listPrice: item.listPrice,
            discountAmount: item.discountAmount,
            discountReason: item.discountReason,
            bundleId: item.bundleId,
            promotionId: item.promotionId,
            isReturned: item.isReturned,
          })),
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
        items: {
          select: {
            id: true,
            tenantId: true,
            saleId: true,
            productId: true,
            stockId: true,
            variantId: true,
            priceAtMoment: true,
            listPrice: true,
            quantity: true,
            discountAmount: true,
            discountReason: true,
            bundleId: true,
            promotionId: true,
            productName: true,
            variantCode: true,
            serialCode: true,
            isSerial: true,
            isReturned: true,
            returnedAt: true,
            returnCondition: true,
          },
        },
      },
    });
    if (!sale) throw new Error("Sale not found");
    const { items, ...rest } = sale;
    return {
      ...rest,
      items: items as unknown as SaleItem[],
    } as unknown as { items: SaleItem[] } & Sale;
  }

  async getSaleByOperationId(operationId: string): Promise<Sale | undefined> {
    const sale = await this.prisma.sale.findFirst({
      where: { operationId },
    });
    return sale as unknown as Sale;
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
        returnCondition: data.returnCondition ? (data.returnCondition as ItemCondition) : undefined,
      },
    });
  }

  async getSalesByOperation(operationId: string): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      where: { operationId },
    });
    return sales as unknown as Sale[];
  }

  async getSales(): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany();
    return sales as unknown as Sale[];
  }

  async getSaleItems(): Promise<SaleItem[]> {
    const items = await this.prisma.saleItem.findMany({
      select: {
        id: true,
        tenantId: true,
        saleId: true,
        productId: true,
        stockId: true,
        variantId: true,
        priceAtMoment: true,
        listPrice: true,
        quantity: true,
        discountAmount: true,
        discountReason: true,
        bundleId: true,
        promotionId: true,
        productName: true,
        variantCode: true,
        serialCode: true,
        isSerial: true,
        isReturned: true,
        returnedAt: true,
        returnCondition: true,
      },
    });
    return items as unknown as SaleItem[];
  }
}
