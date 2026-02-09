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

  shouldDeliverImmediately: boolean;
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
    return await createSaleFromReservationUseCase({
      reservation,
      customerId: reservation.customerId,
      reservationItems: input.reservationItems,
      selectedStocks: input.selectedStocks,
      sellerId: input.sellerId,
      financials: {
        totalAmount: input.totalCalculated,
        paymentMethod: "cash",
        downPayment: input.downPayment,
        receivedAmount: input.totalPaid,
        keepAsCredit: input.isCredit,
        totalPrice: 0,
      },
      notes: input.notes,
      status: input.shouldDeliverImmediately ? "vendido" : "pendiente_entrega",
    });
  }
  
  throw new Error("Tipo de reserva no soportado");
}
