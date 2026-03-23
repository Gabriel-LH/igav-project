import { RentalRepository } from "@/src/domain/tenant/repositories/RentalRepository";
import { Rental } from "@/src/types/rentals/type.rentals";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { PrismaClient, Prisma } from "@/prisma/generated/client";

export class PrismaRentalRepository implements RentalRepository {
  constructor(
    private readonly prisma: PrismaClient | Prisma.TransactionClient,
  ) {}

  async addRental(rental: Rental, rentalItems: RentalItem[]): Promise<void> {
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
        status: rental.status as any,
        notes: rental.notes || "",
        createdAt: rental.createdAt,
        updatedAt: rental.updatedAt,
        items: {
          create: rentalItems.map((item) => ({
            id: item.id,
            tenantId: rental.tenantId,
            operationId: rental.operationId,
            productId: item.productId,
            variantId: item.variantId || "",
            stockId: item.stockId,
            quantity: item.quantity,
            priceAtMoment: item.priceAtMoment,
            discountAmount: item.discountAmount,
            discountReason: item.discountReason,
            conditionOut: item.conditionOut as any,
            itemStatus: item.itemStatus as any,
            notes: item.notes || "",
            listPrice: item.listPrice,
          })),
        },
      },
    });
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
    return item as unknown as RentalItem;
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
    });
    return items as unknown as RentalItem[];
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
