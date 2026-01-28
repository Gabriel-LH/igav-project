import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { RentalFromReservationDTO } from "@/src/interfaces/RentalFromReservationDTO";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { processTransaction } from "../transactionServices";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";

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
  // 1️⃣ Validación
  reservationItems.forEach((item) => {
    if (!selectedStocks[item.id]) {
      throw new Error("Item sin stock asignado");
    }
  });

  // 2️⃣ DTO CORRECTO (RentalFromReservationDTO)
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

  // 3️⃣ Transacción
  const result = processTransaction(rentalDTO);

  // 4️⃣ Movimiento físico
  reservationItems.forEach((item) => {
    useInventoryStore.getState().deliverAndTransfer(
      selectedStocks[item.id],
      reservation.branchId,
      sellerId,
    );
  });

  // 5️⃣ Reserva → convertida
  useReservationStore
    .getState()
    .updateStatus(reservation.id, "convertida");

  return result;
}
