import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { ReservationRepository } from "../../../domain/tenant/repositories/ReservationRepository";
import { GuaranteeRepository } from "../../../domain/tenant/repositories/GuaranteeRepository";
import { GuaranteeType } from "../../../utils/status-type/GuaranteeType";
import { Rental } from "../../../types/rentals/type.rentals";

export class DeliverRentalUseCase {
  constructor(
    private rentalRepo: RentalRepository,
    private inventoryRepo: InventoryRepository,
    private reservationRepo: ReservationRepository,
    private guaranteeRepo: GuaranteeRepository,
  ) {}

  async execute(
    rentalId: string,
    guaranteeData: { value: string; type: GuaranteeType },
    userId: string,
  ): Promise<Rental> {
    const now = new Date();
    const rental = await this.rentalRepo.getRentalById(rentalId);

    if (!rental) {
      throw new Error("Alquiler no encontrado");
    }

    if (rental.status !== "reservado_fisico") {
      throw new Error(
        `No se puede entregar un alquiler en estado ${rental.status}`,
      );
    }

    const rentalItems = await this.rentalRepo.getRentalItemsByRentalId(
      rental.id,
    );

    if (rentalItems.length === 0) {
      throw new Error("El alquiler no tiene items");
    }

    if (rental.guaranteeId && guaranteeData) {
      await this.guaranteeRepo.updateGuarantee(rental.guaranteeId, {
        type: guaranteeData.type,
        value: guaranteeData.value,
        status: "custodia",
      } as any);
    }

    for (const item of rentalItems) {
      if (!item.stockId) {
        throw new Error(`Item ${item.id} no tiene stock asignado`);
      }

      if (item.isSerial) {
        await this.inventoryRepo.updateItemStatus(
          item.stockId,
          "alquilado",
          rental.branchId,
          userId,
        );
      } else {
        await this.inventoryRepo.decreaseLotQuantity(item.stockId, item.quantity);
      }
    }

    await this.rentalRepo.updateRental(rental.id, {
      status: "alquilado",
      updatedAt: now,
      updatedBy: userId,
    });

    if (rental.reservationId) {
      await this.reservationRepo.updateStatus(
        rental.reservationId,
        "convertida",
        "convertida",
      );
    }

    return rental;
  }
}
