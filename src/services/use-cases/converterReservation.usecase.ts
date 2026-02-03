import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { rentalFromReservationUseCase } from "./rentalFromReservation.usecase";
import { sellFromReservationUseCase } from "./sellFromReservation.usecase";

interface ConvertReservationInput {
  reservation: Reservation;
  reservationItems: ReservationItem[];
  selectedStocks: Record<string, string>;
  sellerId: string;
  status: "completado" | "cancelado" | "pendiente_entrega" | "devuelto";

  // financieros genéricos
  totalCalculated: number;
  totalPaid: number;
  isCredit: boolean;

  guarantee?: {
    type: "dinero" | "dni" | "joyas" | "reloj" | "otros" | "no_aplica";
    value?: string;
    description?: string;
  };

  notes?: string;
}

export async function convertReservationUseCase(
  input: ConvertReservationInput,
) {
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
    return sellFromReservationUseCase({
      status: input.status,
      reservation,
      customerId: reservation.customerId,
      reservationItems: input.reservationItems,
      selectedStocks: input.selectedStocks,
      sellerId: input.sellerId,
      financials: {
        totalAmount: input.totalCalculated,
        paymentMethod: "cash",
        receivedAmount: input.totalPaid,
        keepAsCredit: input.isCredit,
        totalPrice: 0,
      },
      notes: input.notes,
    });
  }

  throw new Error("Tipo de reserva no soportado");
}
