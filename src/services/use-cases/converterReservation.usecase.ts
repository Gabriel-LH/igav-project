import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { rentalFromReservationUseCase } from "./rentalFromReservation.usecase";
import { createSaleFromReservationUseCase } from "./sellFromReservation.usecase";

interface ConvertReservationInput {
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
}

function resolveInitialSaleStatus(params: {
  totalCalculated: number;
  totalPaid: number;
  isCredit: boolean;
}) {
  const { totalCalculated, totalPaid, isCredit } = params;

  if (isCredit) return "pendiente_entrega";

  if (totalPaid >= totalCalculated) {
    return "pendiente_entrega";
  }

  return "pendiente_pago";
}

export async function convertReservationUseCase(
  input: ConvertReservationInput,
): Promise<{
  saleId?: string;
  operationId?: string;
  rentalId?: string;
}> {
  const { reservation } = input;
  if (reservation.operationType === "alquiler") {
    return rentalFromReservationUseCase({
      reservation,
      reservationItems: input.reservationItems,
      selectedStocks: input.selectedStocks,
      sellerId: input.sellerId,
      financials: {
        totalRent: input.totalCalculated,
        paymentMethod: "cash",
        receivedAmount: input.totalPaid,
        keepAsCredit: input.isCredit,
        guarantee: {
          type: input.guarantee?.type || "no_aplica",
          value: input.guarantee?.value,
          description: input.guarantee?.description,
        },
      },
    });
  }

  if (reservation.operationType === "venta") {
    const saleStatus = resolveInitialSaleStatus({
      totalCalculated: input.totalCalculated,
      totalPaid: input.totalPaid,
      isCredit: input.isCredit,
    });
    return createSaleFromReservationUseCase({
      reservation,
      customerId: reservation.customerId,
      reservationItems: input.reservationItems,
      selectedStocks: input.selectedStocks,
      sellerId: input.sellerId,
      initialStatus: saleStatus,
      financials: {
        totalAmount: input.totalCalculated,
        paymentMethod: "cash",
        downPayment: input.downPayment,
        receivedAmount: input.totalPaid,
        keepAsCredit: input.isCredit,
        totalPrice: 0,
      },
      notes: input.notes,
    });
  }

  throw new Error("Tipo de reserva no soportado");
}
