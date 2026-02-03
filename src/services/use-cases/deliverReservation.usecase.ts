import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { RentalFromReservationDTO } from "@/src/interfaces/RentalFromReservationDTO";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { processTransaction } from "../transactionServices";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { guaranteeSchema } from "@/src/types/guarantee/type.guarantee";

interface DeliverReservationInput {
  reservation: Reservation;
  reservationItems: ReservationItem[];
  selectedStocks: Record<string, string>;
  sellerId: string;
  financials: RentalDTO["financials"];
}

export async function deliverReservationUseCase({
  reservation,
  reservationItems,
  selectedStocks,
  sellerId,
  financials,
}: DeliverReservationInput) {
  // Validación
  reservationItems.forEach((item) => {
    if (!selectedStocks[item.id]) {
      throw new Error("Item sin stock asignado");
    }
  });

  // DTO CORRECTO (RentalFromReservationDTO)
  const rentalDTO: RentalFromReservationDTO = {
    type: "alquiler",
    customerId: reservation.customerId,
    sellerId,
    branchId: reservation.branchId,

    startDate: reservation.startDate,
    endDate: reservation.endDate,

    reservationId: reservation.id,
    reservationItems: reservationItems.map((item) => ({
      reservationItemId: item.id,
      stockId: selectedStocks[item.id],
    })),

    financials,
    status: "en_curso",
  };

  if (
  financials.guarantee &&
  financials.guarantee.type !== "no_aplica"
) {
  const guarantee = guaranteeSchema.parse({
    id: `GUA-${crypto.randomUUID()}`,
    operationId: reservation.operationId,
    branchId: reservation.branchId,
    receivedById: sellerId,
    type: financials.guarantee.type,
    value: financials.guarantee.value ?? 0,
    description:
      financials.guarantee.description ?? "Garantía de alquiler",
    status: "custodia",
    createdAt: new Date(),
  });

  useGuaranteeStore.getState().addGuarantee(guarantee);
}

  // Transacción
  const result = processTransaction(rentalDTO);

  // Movimiento físico
  reservationItems.forEach((item) => {
    useInventoryStore.getState().deliverAndTransfer(
      selectedStocks[item.id],
      "alquilado",
      reservation.branchId,
      sellerId,
    );
  });

  // Reserva → convertida
  useReservationStore
    .getState()
    .updateStatus(reservation.id, "alquiler", "convertida");

  return result;
}
