import { ReservationRepository } from "../../domain/repositories/ReservationRepository";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { ReservationDTO } from "../../interfaces/ReservationDTO";
import { reservationSchema } from "../../types/reservation/type.reservation";
import { reservationItemSchema } from "../../types/reservation/type.reservationItem";

export class CreateReservationUseCase {
  constructor(
    private reservationRepo: ReservationRepository,
    private inventoryRepo: InventoryRepository,
  ) {}

  execute(dto: ReservationDTO, operationId: string, totalAmount: number): any {
    const now = new Date();
    const totalUnits = dto.items.reduce((acc, i) => acc + (i.quantity || 1), 0);

    const reservation = reservationSchema.parse({
      id: `RES-${operationId}`,
      operationId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      productId: dto.items[0].productId,
      stockId: dto.items[0].stockId,
      operationType: dto.operationType,
      startDate: dto.reservationDateRange.from,
      endDate: dto.reservationDateRange.to,
      hour: dto.reservationDateRange.hourFrom,
      status: "confirmada",
      notes: dto.notes ?? "",
      createdAt: now,
      updatedAt: now,
    });

    const reservationItems = reservationItemSchema.array().parse(
      dto.items.map((item) => ({
        id: `RITEM-${Math.random().toString(36).substring(2, 9)}`,
        operationId: String(operationId),
        reservationId: reservation.id,
        productId: item.productId,
        stockId: item.stockId,
        quantity: item.quantity ?? 1,
        sizeId: item.sizeId,
        colorId: item.colorId,
        priceAtMoment:
          item.priceAtMoment || (totalUnits > 0 ? totalAmount / totalUnits : 0),
        listPrice: item.listPrice,
        discountAmount: item.discountAmount ?? 0,
        discountReason: item.discountReason,
        bundleId: item.bundleId,
        promotionId: item.promotionId,
        itemStatus: "confirmada",
        notes: dto.notes ?? "",
      })),
    );

    this.reservationRepo.addReservation(reservation, reservationItems);

    reservationItems.forEach((item) => {
      if (item.stockId) {
        if (this.inventoryRepo.isSerial(item.stockId)) {
          this.inventoryRepo.updateItemStatus(item.stockId, "reservado");
        }
      }
    });

    return reservation;
  }
}
