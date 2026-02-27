import { RentalRepository } from "../../domain/repositories/RentalRepository";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository";
import { GuaranteeRepository } from "../../domain/repositories/GuaranteeRepository";
import { GuaranteeType } from "../../utils/status-type/GuaranteeType";
import { Rental } from "../../types/rentals/type.rentals";

export class DeliverRentalUseCase {
  constructor(
    private rentalRepo: RentalRepository,
    private inventoryRepo: InventoryRepository,
    private reservationRepo: ReservationRepository,
    private guaranteeRepo: GuaranteeRepository,
  ) {}

  execute(
    rentalId: string,
    guaranteeData: { value: string; type: GuaranteeType },
    userId: string,
  ): Rental {
    const now = new Date();
    const rental = this.rentalRepo.getRentalById(rentalId);

    if (!rental) {
      throw new Error("Alquiler no encontrado");
    }

    if (rental.status !== "reservado_fisico") {
      throw new Error(
        `No se puede entregar un alquiler en estado ${rental.status}`,
      );
    }

    const rentalItems = this.rentalRepo.getRentalItemsByRentalId(rental.id);

    if (rentalItems.length === 0) {
      throw new Error("El alquiler no tiene items");
    }

    if (rental.guaranteeId && guaranteeData) {
      this.guaranteeRepo.updateGuarantee(rental.guaranteeId, {
        type: guaranteeData.type,
        value: guaranteeData.value,
        status: "custodia",
      } as any);
    }

    rentalItems.forEach((item) => {
      if (!item.stockId) {
        throw new Error(`Item ${item.id} no tiene stock asignado`);
      }

      this.inventoryRepo.updateItemStatus(
        item.stockId,
        "alquilado",
        rental.branchId,
        userId,
      );

      this.inventoryRepo.decreaseLotQuantity(item.stockId, 1);
    });

    this.rentalRepo.updateRental(rental.id, {
      status: "alquilado",
      updatedAt: now,
      updatedBy: userId,
    });

    if (rental.reservationId) {
      this.reservationRepo.updateStatus(
        rental.reservationId,
        "alquiler",
        "convertida",
      );
    }

    return rental;
  }
}
