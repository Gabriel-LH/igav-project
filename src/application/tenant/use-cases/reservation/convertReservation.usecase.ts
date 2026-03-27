import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { RentalFromReservationDTO } from "@/src/application/dtos/RentalFromReservationDTO";
import { SaleFromReservationDTO } from "@/src/application/dtos/SaleFromReservationDTO";
import { ProcessTransactionUseCase } from "@/src/application/tenant/use-cases/process-transaction/ProcessTransaction.usecase";
import { ReservationRepository } from "@/src/domain/tenant/repositories/ReservationRepository";
import { InventoryRepository } from "@/src/domain/tenant/repositories/InventoryRepository";
import { GuaranteeRepository } from "@/src/domain/tenant/repositories/GuaranteeRepository";
import { RentalRepository } from "@/src/domain/tenant/repositories/RentalRepository";
import { guaranteeSchema } from "@/src/types/guarantee/type.guarantee";

export interface ConvertReservationInput {
  reservation: Reservation;
  reservationItems: ReservationItem[];
  selectedStocks: Record<string, string>;
  sellerId: string;
  tenantId: string;
  totalCalculated: number;
  totalPaid: number;
  isCredit: boolean;
  downPayment: number;
  guarantee?: {
    type: "dinero" | "dni" | "joyas" | "reloj" | "otros" | "no_aplica";
    value?: string;
    description?: string;
  };
  notes?: string;
  shouldDeliverImmediately: boolean;
  configSnapshot?: unknown;
  policySnapshot?: unknown;
  configVersion?: Date;
  policyVersion?: number;
}

export class ConvertReservationUseCase {
  constructor(
    private reservationRepo: ReservationRepository,
    private inventoryRepo: InventoryRepository,
    private guaranteeRepo: GuaranteeRepository,
    private rentalRepo: RentalRepository,
    private processTransactionUC: ProcessTransactionUseCase,
  ) {}

  async execute(input: ConvertReservationInput): Promise<{
    saleId?: string;
    operationId?: string;
    rentalId?: string;
  }> {
    const { reservation } = input;

    input.reservationItems.forEach((item) => {
      if (
        !input.selectedStocks[`${item.id}-0`] &&
        !input.selectedStocks[item.id]
      ) {
        throw new Error("Item sin stock asignado");
      }
    });

    if (reservation.operationType === "alquiler") {
      const rentalDTO: RentalFromReservationDTO = {
        type: "alquiler",
        tenantId: input.tenantId,
        customerId: reservation.customerId,
        sellerId: input.sellerId,
        branchId: reservation.branchId,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        reservationId: reservation.id,
        reservationItems: input.reservationItems.map((item) => ({
          reservationItemId: item.id,
          stockId:
            input.selectedStocks[`${item.id}-0`] ||
            input.selectedStocks[item.id],
        })),
        financials: {
          subtotal: input.totalCalculated,
          totalAmount: input.totalCalculated,
          totalDiscount: 0,
          paymentMethod: "cash",
          receivedAmount: input.totalPaid,
          keepAsCredit: input.isCredit,
          guarantee: {
            type: input.guarantee?.type || "no_aplica",
            value: input.guarantee?.value,
            description: input.guarantee?.description,
          },
        } as any,
        status: "alquilado",
        configSnapshot: input.configSnapshot,
        policySnapshot: input.policySnapshot,
        configVersion: input.configVersion,
        policyVersion: input.policyVersion,
      };

      const guaranteeInput = input.guarantee;
      const guaranteeId =
        guaranteeInput && guaranteeInput.type !== "no_aplica"
          ? `GUA-${crypto.randomUUID()}`
          : undefined;

      const res = await this.processTransactionUC.execute(rentalDTO as any);
      const result = res;

      if (guaranteeInput && guaranteeId && guaranteeInput.type !== "no_aplica") {
        const guarantee = guaranteeSchema.parse({
          id: guaranteeId,
          tenantId: reservation.tenantId,
          operationId: result.operation.id,
          branchId: reservation.branchId,
          receivedById: input.sellerId,
          type: guaranteeInput.type,
          value: guaranteeInput.value ?? 0,
          description: guaranteeInput.description ?? "Garantia de alquiler",
          status: "custodia",
          createdAt: new Date(),
        });

        await this.guaranteeRepo.addGuarantee(guarantee);
        await this.rentalRepo.updateRental(result.details.id, {
          guaranteeId: guarantee.id,
        } as any);
      }

      for (const item of input.reservationItems) {
        await this.inventoryRepo.updateItemStatus(
          input.selectedStocks[`${item.id}-0`] || input.selectedStocks[item.id],
          "alquilado",
          reservation.branchId,
          input.sellerId,
        );
      }

      await this.reservationRepo.updateStatus(
        reservation.id,
        "convertida",
        "convertida",
      );

      return {
        operationId: result.operation.id,
        rentalId: result.details.id,
      };
    }

    if (reservation.operationType === "venta") {
      const saleDTO: SaleFromReservationDTO = {
        type: "venta",
        tenantId: input.tenantId,
        status: input.shouldDeliverImmediately
          ? "vendido"
          : "pendiente_entrega",
        reservationId: reservation.id,
        customerId: reservation.customerId,
        reservationItems: input.reservationItems.map((item) => ({
          reservationItemId: item.id,
          stockId:
            input.selectedStocks[`${item.id}-0`] ||
            input.selectedStocks[item.id],
        })),
        sellerId: input.sellerId,
        branchId: reservation.branchId,
        financials: {
          totalAmount: input.totalCalculated,
          paymentMethod: "cash",
          receivedAmount: input.totalPaid,
          keepAsCredit: input.isCredit,
          totalPrice: 0,
        } as any,
        notes: input.notes,
        configSnapshot: input.configSnapshot,
        policySnapshot: input.policySnapshot,
        configVersion: input.configVersion,
        policyVersion: input.policyVersion,
      };

      const res = await this.processTransactionUC.execute(saleDTO as any);
      const result = res;

      await this.reservationRepo.updateStatus(
        reservation.id,
        "convertida",
        "convertida",
      );

      return {
        saleId: result.details.id,
        operationId: result.operation.id,
      };
    }

    throw new Error("Tipo de reserva no soportado");
  }
}
