import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { RentalFromReservationDTO } from "@/src/interfaces/RentalFromReservationDTO";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { processTransaction } from "../transactionServices";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { guaranteeSchema } from "@/src/types/guarantee/type.guarantee";

interface RentalFromReservationInput {
  reservation: Reservation;
  reservationItems: ReservationItem[];
  selectedStocks: Record<string, string>;
  sellerId: string;
  financials: RentalDTO["financials"];
}

export async function rentalFromReservationUseCase({
  reservation,
  reservationItems,
  selectedStocks,
  sellerId,
  financials,
}: RentalFromReservationInput) {
  // Validación
  reservationItems.forEach((item) => {
    // El viewer usa formato "id-0" para el primer item (y unicos)
    if (!selectedStocks[`${item.id}-0`] && !selectedStocks[item.id]) {
      throw new Error("Item sin stock asignado");
    }
  });

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
      stockId: selectedStocks[`${item.id}-0`] || selectedStocks[item.id],
    })),

    financials,
    status: "alquilado",
  };

  const guaranteeInput = (financials as any).guarantee;
  if (guaranteeInput && guaranteeInput.type !== "no_aplica") {
    const guarantee = guaranteeSchema.parse({
      id: `GUA-${crypto.randomUUID()}`,
      operationId: reservation.operationId,
      branchId: reservation.branchId,
      receivedById: sellerId,
      type: guaranteeInput.type,
      value: guaranteeInput.value ?? 0,
      description: guaranteeInput.description ?? "Garantía de alquiler",
      status: "custodia",
      createdAt: new Date(),
    });

    useGuaranteeStore.getState().addGuarantee(guarantee);
  }

  // Transacción
  const result = processTransaction(rentalDTO);

  // Movimiento físico
  reservationItems.forEach((item) => {
    useInventoryStore
      .getState()
      .updateItemStatus(
        selectedStocks[`${item.id}-0`] || selectedStocks[item.id],
        "alquilado",
        reservation.branchId,
        sellerId,
      );
  });

  // Reserva → convertida
  useReservationStore
    .getState()
    .updateStatus(reservation.id, "alquiler", "convertida");

  return {
    result,
    operationId: result.operation.id,
    rentalId: result.details.id,
  };
}
