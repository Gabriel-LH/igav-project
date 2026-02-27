import { Reservation } from "../../types/reservation/type.reservation";
import { ReservationItem } from "../../types/reservation/type.reservationItem";
import { RentalFromReservationDTO } from "../../interfaces/RentalFromReservationDTO";
import { SaleFromReservationDTO } from "../../interfaces/SaleFromReservationDTO";
import { processTransaction } from "../orchestrators/processTransaction.orchestrator"; 
import { ReservationRepository } from "../../domain/repositories/ReservationRepository";
import { InventoryRepository } from "../../domain/repositories/InventoryRepository";
import { GuaranteeRepository } from "../../domain/repositories/GuaranteeRepository";
import { guaranteeSchema } from "../../types/guarantee/type.guarantee";

export interface ConvertReservationInput {
  reservation: Reservation;
  reservationItems: ReservationItem[];
  selectedStocks: Record<string, string>;
  sellerId: string;

  // financieros genéricos
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
}

export class ConvertReservationUseCase {
  constructor(
    private reservationRepo: ReservationRepository,
    private inventoryRepo: InventoryRepository,
    private guaranteeRepo: GuaranteeRepository,
  ) {}

  async execute(input: ConvertReservationInput): Promise<{
    saleId?: string;
    operationId?: string;
    rentalId?: string;
  }> {
    const {
      reservation,
      reservationItems,
      selectedStocks,
      sellerId,
      financials,
      notes,
      status,
    } = input as any;

    // Validación de stocks asignados (común)
    input.reservationItems.forEach((item) => {
      // El viewer usa formato "id-0" para el primer item (y unicos)
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
      };

      const guaranteeInput = input.guarantee;
      if (guaranteeInput && guaranteeInput.type !== "no_aplica") {
        const guarantee = guaranteeSchema.parse({
          id: `GUA-${crypto.randomUUID()}`,
          operationId: reservation.operationId,
          branchId: reservation.branchId,
          receivedById: input.sellerId,
          type: guaranteeInput.type,
          value: guaranteeInput.value ?? 0,
          description: guaranteeInput.description ?? "Garantía de alquiler",
          status: "custodia",
          createdAt: new Date(),
        });

        this.guaranteeRepo.addGuarantee(guarantee);
      }

      // Transacción
      const result = processTransaction(rentalDTO);

      // Movimiento físico
      input.reservationItems.forEach((item) => {
        this.inventoryRepo.updateItemStatus(
          input.selectedStocks[`${item.id}-0`] || input.selectedStocks[item.id],
          "alquilado",
          reservation.branchId,
          input.sellerId,
        );
      });

      // Reserva → convertida
      this.reservationRepo.updateStatus(
        reservation.id,
        "alquiler",
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
      };

      const result = processTransaction(saleDTO);

      this.reservationRepo.updateStatus(reservation.id, "venta", "convertida");

      return {
        saleId: result.details.id,
        operationId: result.operation.id,
      };
    }

    throw new Error("Tipo de reserva no soportado");
  }
}
