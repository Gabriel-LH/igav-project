import { RentalRepository } from "../../domain/repositories/RentalRepository";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository";
import { GuaranteeRepository } from "../../domain/repositories/GuaranteeRepository";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { RentalDTO } from "../../interfaces/RentalDTO";
import { RentalFromReservationDTO } from "../../interfaces/RentalFromReservationDTO";
import { rentalSchema } from "../../types/rentals/type.rentals";
import { rentalItemSchema } from "../../types/rentals/type.rentalsItem";
import { guaranteeSchema } from "../../types/guarantee/type.guarantee";
import { InventoryItemStatus } from "../../utils/status-type/InventoryItemStatusType";

export class CreateRentalUseCase {
  constructor(
    private rentalRepo: RentalRepository,
    private reservationRepo: ReservationRepository,
    private guaranteeRepo: GuaranteeRepository,
    private inventoryRepo: InventoryRepository,
  ) {}

  execute(
    dto: RentalDTO | RentalFromReservationDTO,
    operationId: string,
    tenantId: string,
  ): any {
    const now = new Date();
    const fromReservation =
      "reservationId" in dto && Array.isArray((dto as any).reservationItems);

    let guaranteeData: any = null;

    if (
      !fromReservation &&
      (dto as RentalDTO).guarantee &&
      (dto as RentalDTO).guarantee?.type !== "no_aplica"
    ) {
      guaranteeData = guaranteeSchema.parse({
        id: crypto.randomUUID(),
        operationId: String(operationId),
        branchId: dto.branchId,
        receivedById: dto.sellerId,
        type: (dto as RentalDTO).guarantee?.type,
        value: (dto as RentalDTO).guarantee?.value || "",
        description:
          (dto as RentalDTO).guarantee?.description || "Garantía de alquiler",
        status:
          (dto as RentalDTO).guarantee?.type === "por_cobrar"
            ? "pendiente"
            : "custodia",
        createdAt: now,
      });

      this.guaranteeRepo.addGuarantee(guaranteeData);
    }

    if (fromReservation) {
      this.reservationRepo.updateStatus(
        (dto as RentalFromReservationDTO).reservationId,
        "alquiler",
        "convertida",
      );
      (dto as RentalFromReservationDTO).reservationItems.forEach((item) => {
        this.reservationRepo.updateReservationItemStatus(
          item.reservationItemId,
          "convertida",
        );
      });
    }

    const rental = rentalSchema.parse({
      id: crypto.randomUUID(),
      tenantId,
      operationId: String(operationId),
      reservationId: fromReservation
        ? (dto as RentalFromReservationDTO).reservationId
        : undefined,
      customerId: dto.customerId,
      branchId: dto.branchId,
      outDate: dto.startDate,
      expectedReturnDate: dto.endDate,
      status: dto.status,
      guaranteeId: guaranteeData ? guaranteeData.id : undefined,
      createdAt: now,
      updatedAt: now,
      notes: !fromReservation ? ((dto as RentalDTO).notes ?? "") : "",
    });

    let rentalItems: any[] = [];

    if (fromReservation) {
      const reservationItemsData = this.reservationRepo.getReservationItems();
      rentalItems = rentalItemSchema.array().parse(
        (dto as RentalFromReservationDTO).reservationItems.map((item) => {
          const reservationItem = reservationItemsData.find(
            (ri) => ri.id === item.reservationItemId,
          );
          if (!reservationItem)
            throw new Error(`ReservationItem no encontrado`);
          return {
            id: crypto.randomUUID(),
            rentalId: rental.id,
            operationId: String(operationId),
            productId: reservationItem.productId,
            stockId: item.stockId,
            quantity: reservationItem.quantity ?? 1,
            sizeId: reservationItem.sizeId,
            colorId: reservationItem.colorId,
            priceAtMoment: reservationItem.priceAtMoment,
            listPrice:
              reservationItem.listPrice ?? reservationItem.priceAtMoment,
            discountAmount: reservationItem.discountAmount ?? 0,
            discountReason: reservationItem.discountReason,
            bundleId: reservationItem.bundleId,
            promotionId: reservationItem.promotionId,
            conditionOut: "Excelente",
            itemStatus: "alquilado",
            notes: "",
          };
        }),
      );
    } else {
      rentalItems = rentalItemSchema.array().parse(
        (dto as RentalDTO).items.map((item) => ({
          id: `RITEM-${Math.random().toString(36).substring(2, 9)}`,
          rentalId: rental.id,
          operationId: String(operationId),
          productId: item.productId,
          stockId: item.stockId,
          quantity: item.quantity ?? 1,
          sizeId: item.sizeId,
          colorId: item.colorId,
          priceAtMoment: item.priceAtMoment ?? 0,
          listPrice: item.listPrice ?? item.priceAtMoment ?? 0,
          discountAmount: item.discountAmount ?? 0,
          discountReason: item.discountReason,
          bundleId: item.bundleId,
          promotionId: item.promotionId,
          conditionOut: "Excelente",
          itemStatus: "alquilado",
          notes: (dto as any).notes ?? "",
        })),
      );
    }

    this.rentalRepo.addRental(rental, rentalItems);

    const finalRentalStockStatus =
      dto.status === "reservado_fisico" ? "reservado_fisico" : "alquilado";

    rentalItems.forEach((item) => {
      if (this.inventoryRepo.isSerial(item.stockId)) {
        this.inventoryRepo.updateItemStatus(
          item.stockId,
          finalRentalStockStatus as InventoryItemStatus,
          dto.branchId,
          dto.sellerId,
        );
      } else {
        this.inventoryRepo.decreaseLotQuantity(item.stockId, item.quantity);
      }
    });

    return { rental, guaranteeData };
  }
}
