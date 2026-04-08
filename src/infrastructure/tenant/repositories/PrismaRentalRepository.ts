import { RentalRepository } from "@/src/domain/tenant/repositories/RentalRepository";
import { Rental } from "@/src/types/rentals/type.rentals";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { PrismaClient, Prisma, RentalItemStatus, RentalStatus } from "@/prisma/generated/client";

export class PrismaRentalRepository implements RentalRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addRental(rental: Rental, rentalItems: RentalItem[], discountsApplied?: any[]): Promise<void> {
    const rentalItemData = await Promise.all(
      rentalItems.map(async (item) => {
        const resolvedIds = await this.resolveRentalItemIds(item);
        const isSerial = item.isSerial ?? Boolean(resolvedIds.inventoryItemId);

        return {
          id: item.id,
          tenantId: rental.tenantId,
          rentalId: rental.id,
          operationId: rental.operationId,
          productId: item.productId,
          variantId: item.variantId || "",
          inventoryItemId: resolvedIds.inventoryItemId,
          stockLotId: resolvedIds.stockLotId,
          quantity: item.quantity,
          priceAtMoment: item.priceAtMoment,
          discountAmount: item.discountAmount ?? 0,
          discountReason: item.discountReason ?? null,
          bundleId: item.bundleId ?? null,
          promotionId: item.promotionId ?? null,
          conditionOut: item.conditionOut,
          itemStatus: item.itemStatus as RentalItemStatus,
          notes: item.notes || "",
          listPrice: item.listPrice,
          isSerial,
        };
      }),
    );

    await this.prisma.rental.create({
      data: {
        id: rental.id,
        tenantId: rental.tenantId,
        operationId: rental.operationId,
        customerId: rental.customerId,
        branchId: rental.branchId,
        reservationId: rental.reservationId || null,
        guaranteeId: rental.guaranteeId || null,
        outDate: rental.outDate,
        expectedReturnDate: rental.expectedReturnDate,
        actualReturnDate: rental.actualReturnDate,
        subTotal: (rental as any).subTotal || 0,
        totalDiscount: (rental as any).totalDiscount || 0,
        status: rental.status as RentalStatus,
        notes: rental.notes || "",
        createdAt: rental.createdAt,
        updatedAt: rental.updatedAt,
      },
    });

    if ((this.prisma as any).discountApplied) {
      await (this.prisma as any).discountApplied.updateMany({
        where: {
          operationId: rental.operationId,
          rentalId: null,
          saleId: null,
        },
        data: {
          rentalId: rental.id,
        },
      });
    }

    if (discountsApplied && discountsApplied.length > 0) {
      if ((this.prisma as any).discountApplied) {
        await (this.prisma as any).discountApplied.createMany({
          data: discountsApplied.map(d => ({
            id: d.id,
            tenantId: rental.tenantId,
            operationId: rental.operationId,
            rentalId: rental.id,
            amount: d.amount,
            reason: d.reason,
            promotionId: d.promotionId || null,
            description: d.description || null,
            rentalItemId: d.rentalItemId || null,
            createdAt: d.createdAt || new Date(),
          })),
        });
      } else {
        console.warn("Prisma warning: discountApplied model not found on client in PrismaRentalRepository.");
      }
    }


    if (rentalItemData.length > 0) {
      await this.prisma.rentalItem.createMany({
        data: rentalItemData,
      });
    }
  }

  async getRentals(): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany();
    return rentals as unknown as Rental[];
  }

  async getRentalItems(): Promise<RentalItem[]> {
    const items = await this.prisma.rentalItem.findMany({
      select: {
        id: true,
        tenantId: true,
        rentalId: true,
        operationId: true,
        productId: true,
        variantId: true,
        priceAtMoment: true,
        quantity: true,
        conditionOut: true,
        conditionIn: true,
        isDamaged: true,
        damageNotes: true,
        discountAmount: true,
        discountReason: true,
        bundleId: true,
        promotionId: true,
        productName: true,
        variantCode: true,
        serialCode: true,
        isSerial: true,
        notes: true,
        listPrice: true,
        itemStatus: true,
        stockLotId: true,
        inventoryItemId: true,
      },
    });
    return items.map(this.mapRentalItem);
  }

  async updateStatus(id: string, newStatus: string): Promise<void> {
    await this.prisma.rental.update({
      where: { id },
      data: { status: newStatus as any },
    });
  }

  async finishRental(id: string): Promise<void> {
    await this.prisma.rental.update({
      where: { id },
      data: { status: "devuelto", actualReturnDate: new Date() },
    });
  }

  async updateItemStatusAndCondition(
    itemId: string,
    newStatus: string,
    conditionIn: string,
  ): Promise<void> {
    await this.prisma.rentalItem.update({
      where: { id: itemId },
      data: {
        itemStatus: newStatus as any,
        conditionIn: conditionIn as any,
      },
    });
  }

  async getRentalById(id: string): Promise<Rental | undefined> {
    const rental = await this.prisma.rental.findUnique({
      where: { id },
    });
    return rental as unknown as Rental;
  }

  async getRentalItemById(id: string): Promise<RentalItem | undefined> {
    const item = await this.prisma.rentalItem.findUnique({
      where: { id },
    });
    return item ? this.mapRentalItem(item) : undefined;
  }

  async getRentalByOperationId(operationId: string): Promise<Rental | undefined> {
    const rental = await this.prisma.rental.findFirst({
      where: { operationId },
    });
    return rental as unknown as Rental;
  }

  async getRentalItemsByRentalId(rentalId: string): Promise<RentalItem[]> {
    const items = await this.prisma.rentalItem.findMany({
      where: { rentalId },
      select: {
        id: true,
        tenantId: true,
        rentalId: true,
        operationId: true,
        productId: true,
        variantId: true,
        priceAtMoment: true,
        quantity: true,
        conditionOut: true,
        conditionIn: true,
        isDamaged: true,
        damageNotes: true,
        discountAmount: true,
        discountReason: true,
        bundleId: true,
        promotionId: true,
        productName: true,
        variantCode: true,
        serialCode: true,
        isSerial: true,
        notes: true,
        listPrice: true,
        itemStatus: true,
        stockLotId: true,
        inventoryItemId: true,
      },
    });
    return items.map(this.mapRentalItem);
  }

  private mapRentalItem(item: any): RentalItem {
    const stockId = item.inventoryItemId ?? item.stockLotId ?? "";

    return {
      ...(item as unknown as RentalItem),
      stockId,
      isSerial: item.isSerial ?? Boolean(item.inventoryItemId),
    };
  }

  private async resolveRentalItemIds(item: RentalItem): Promise<{
    inventoryItemId: string | null;
    stockLotId: string | null;
  }> {
    if (item.inventoryItemId || item.stockLotId) {
      return {
        inventoryItemId: item.inventoryItemId ?? null,
        stockLotId: item.stockLotId ?? null,
      };
    }

    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: item.stockId },
      select: { id: true },
    });

    if (inventoryItem) {
      return { inventoryItemId: inventoryItem.id, stockLotId: null };
    }

    const stockLot = await this.prisma.stockLot.findUnique({
      where: { id: item.stockId },
      select: { id: true },
    });

    if (stockLot) {
      return { inventoryItemId: null, stockLotId: stockLot.id };
    }

    throw new Error(`Stock no encontrado para rental item ${item.id}`);
  }

  async processReturnItem(itemId: string, status: string): Promise<void> {
    await this.prisma.rentalItem.update({
      where: { id: itemId },
      data: { itemStatus: status as any },
    });
  }

  async updateRental(id: string, data: Partial<Rental>): Promise<void> {
    await this.prisma.rental.update({
      where: { id },
      data: {
        ...(data as any),
        status: data.status ? (data.status as any) : undefined,
      },
    });
  }

  async cancelRental(id: string, reason?: string): Promise<void> {
    await this.prisma.rental.update({
      where: { id },
      data: {
        status: "anulado",
        notes: reason ? `${reason}` : undefined,
      },
    });
  }

  async getRentalsByOperation(operationId: string): Promise<Rental[]> {
    const rentals = await this.prisma.rental.findMany({
      where: { operationId },
    });
    return rentals as unknown as Rental[];
  }
}
