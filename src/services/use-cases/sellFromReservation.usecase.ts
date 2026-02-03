// src/services/use-cases/sellFromReservation.usecase.ts

import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { SaleFromReservationDTO } from "@/src/interfaces/SaleFromReservationDTO";
import { processTransaction } from "../transactionServices";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";

interface SellFromReservationInput {
  reservation: Reservation;
  reservationItems: ReservationItem[];
  selectedStocks: Record<string, string>;
  sellerId: string;
  financials: SaleFromReservationDTO["financials"];
  paymentMethod: SaleFromReservationDTO["paymentMethod"];
  receivedAmount: number;
  notes?: string;
}

export async function sellFromReservationUseCase({
  reservation,
  reservationItems,
  selectedStocks,
  sellerId,
  financials,
  paymentMethod,
  receivedAmount,
  notes,
}: SellFromReservationInput) {
  // 1️⃣ Validaciones
  reservationItems.forEach((item) => {
    if (!selectedStocks[item.id]) {
      throw new Error("Item sin stock asignado");
    }
  });

  if (reservation.status !== "confirmada") {
    throw new Error("La reserva no está en estado válido para venta");
  }

  // 2️⃣ DTO
  const saleDTO: SaleFromReservationDTO = {
    type: "venta",

    reservationId: reservation.id,

    reservationItems: reservationItems.map((item) => ({
      reservationItemId: item.id,
      stockId: selectedStocks[item.id],
    })),

    sellerId,
    branchId: reservation.branchId,

    paymentMethod,
    receivedAmount,

    financials,

    notes,
  };

  // 3️⃣ Transacción (venta + pagos + operación)
  const result = processTransaction(saleDTO);

  // 4️⃣ Movimiento físico (stock → vendido)
  reservationItems.forEach((item) => {
    useInventoryStore.getState().deliverAndTransfer(
      selectedStocks[item.id],
      "vendido",
      reservation.branchId,
      sellerId,
    );
  });

  // 5️⃣ Reserva → convertida (venta)
  useReservationStore.getState().updateStatus(reservation.id, "venta", "convertida");

  return result;
}
