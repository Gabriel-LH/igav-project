import { RentalRepository } from "../../domain/repositories/RentalRepository";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { GuaranteeRepository } from "../../domain/repositories/GuaranteeRepository";
import { OperationRepository } from "../../domain/repositories/OperationRepository";
import { InventoryItemStatus } from "../../utils/status-type/InventoryItemStatusType";

export interface ProcessReturnInput {
  rentalId: string;
  rentalStatus: "devuelto" | "con_daños" | "perdido";

  items: {
    rentalItemId: string;
    itemStatus: "devuelto" | "en_lavanderia" | "en_mantenimiento" | "baja";
    stockTarget: InventoryItemStatus;
  }[];

  totalPenalty: number;
  guaranteeResult: "devuelta" | "retenida";
  notes?: string;
  adminId: string;
}

export class ProcessReturnUseCase {
  constructor(
    private rentalRepo: RentalRepository,
    private inventoryRepo: InventoryRepository,
    private guaranteeRepo: GuaranteeRepository,
    private operationRepo: OperationRepository,
  ) {}

  execute(input: ProcessReturnInput): void {
    const now = new Date();

    const rental = this.rentalRepo.getRentalById(input.rentalId);
    if (!rental) throw new Error("Rental no encontrado");

    input.items.forEach((itemInput) => {
      this.rentalRepo.processReturnItem(
        itemInput.rentalItemId,
        itemInput.itemStatus,
      );
    });

    this.rentalRepo.updateRental(rental.id, {
      status: input.rentalStatus,
      actualReturnDate: now,
      notes: input.notes,
    });

    input.items.forEach((itemInput) => {
      const rentalItem = this.rentalRepo.getRentalItemById(
        itemInput.rentalItemId,
      );
      if (!rentalItem) return;

      const isSerial = this.inventoryRepo.isSerial(rentalItem.stockId);

      if (isSerial) {
        this.inventoryRepo.updateItemStatus(
          rentalItem.stockId,
          itemInput.stockTarget,
          undefined,
          input.adminId,
        );
      } else {
        if (itemInput.stockTarget === "disponible") {
          this.inventoryRepo.increaseLotQuantity(
            rentalItem.stockId,
            rentalItem.quantity,
          );
        }
      }
    });

    if (rental.guaranteeId) {
      this.guaranteeRepo.updateGuaranteeStatus(
        rental.guaranteeId,
        input.guaranteeResult,
      );
    }

    if (input.rentalStatus === "devuelto") {
      this.operationRepo.updateOperationStatus(
        rental.operationId,
        "completado",
      );
    }
  }
}
