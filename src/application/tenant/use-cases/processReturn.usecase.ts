import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { GuaranteeRepository } from "../../../domain/tenant/repositories/GuaranteeRepository";
import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { InventoryItemStatus } from "../../../utils/status-type/InventoryItemStatusType";

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

  async execute(input: ProcessReturnInput): Promise<void> {
    const now = new Date();

    const rental = await this.rentalRepo.getRentalById(input.rentalId);
    if (!rental) throw new Error("Rental no encontrado");

    await Promise.all(
      input.items.map((itemInput) =>
        this.rentalRepo.processReturnItem(
          itemInput.rentalItemId,
          itemInput.itemStatus,
        ),
      ),
    );

    await this.rentalRepo.updateRental(rental.id, {
      status: input.rentalStatus,
      actualReturnDate: now,
      notes: input.notes,
    });

    await Promise.all(
      input.items.map(async (itemInput) => {
        const rentalItem = await this.rentalRepo.getRentalItemById(
          itemInput.rentalItemId,
        );
        if (!rentalItem) return;

        const isSerial = await this.inventoryRepo.isSerial(rentalItem.stockId);

        if (isSerial) {
          await this.inventoryRepo.updateItemStatus(
            rentalItem.stockId,
            itemInput.stockTarget,
            undefined,
            input.adminId,
          );
        } else {
          if (itemInput.stockTarget === "disponible") {
            await this.inventoryRepo.increaseLotQuantity(
              rentalItem.stockId,
              rentalItem.quantity,
            );
          }
        }
      }),
    );

    if (rental.guaranteeId) {
      await this.guaranteeRepo.updateGuaranteeStatus(
        rental.guaranteeId,
        input.guaranteeResult,
      );
    }

    if (input.rentalStatus === "devuelto") {
      await this.operationRepo.updateOperationStatus(
        rental.operationId,
        "completado",
      );
    }
  }
}
