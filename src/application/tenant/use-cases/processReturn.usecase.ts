import { RentalRepository } from "../../../domain/tenant/repositories/RentalRepository";
import { InventoryRepository } from "../../../domain/tenant/repositories/InventoryRepository";
import { GuaranteeRepository } from "../../../domain/tenant/repositories/GuaranteeRepository";
import { OperationRepository } from "../../../domain/tenant/repositories/OperationRepository";
import { InventoryItemStatus } from "../../../utils/status-type/InventoryItemStatusType";
import { calculateLateFee } from "@/src/utils/rentals/late-fee";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";

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

  async execute(input: ProcessReturnInput): Promise<{
    isLate: boolean;
    daysLate: number;
    lateFee: number;
  }> {
    const now = new Date();

    const rental = await this.rentalRepo.getRentalById(input.rentalId);
    if (!rental) throw new Error("Rental no encontrado");

    const operation = await this.operationRepo.getOperationById(
      rental.operationId,
    );
    const policySnapshot = operation?.policySnapshot as TenantPolicy | undefined;
    const policy: TenantPolicy = {
      id: "policy-default",
      tenantId: rental.tenantId,
      version: 1,
      isActive: true,
      createdAt: new Date(0),
      updatedBy: "system",
      ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy),
      ...(policySnapshot ?? {}),
      rentals: {
        ...(DEFAULT_TENANT_POLICY_SECTIONS as TenantPolicy).rentals,
        ...(policySnapshot?.rentals ?? {}),
      },
    };
    const lateFeeResult = calculateLateFee({
      policySnapshot,
      expectedReturnDate: new Date(rental.expectedReturnDate),
      actualReturnDate: now,
      totalAmount: operation?.totalAmount ?? 0,
    });

    if (lateFeeResult.isLate && policy.rentals?.allowLateReturn === false) {
      throw new Error("No se permiten devoluciones con atraso.");
    }

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

        const stockId = rentalItem.inventoryItemId ?? rentalItem.stockId;
        const isSerial = await this.inventoryRepo.isSerial(stockId);

        if (isSerial) {
          await this.inventoryRepo.updateItemStatus(
            stockId,
            itemInput.stockTarget,
            undefined,
            input.adminId,
          );
        } else {
          if (itemInput.stockTarget === "disponible") {
            await this.inventoryRepo.increaseLotQuantity(
              stockId,
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

    return {
      isLate: lateFeeResult.isLate,
      daysLate: lateFeeResult.daysLate,
      lateFee: lateFeeResult.lateFee,
    };
  }
}
