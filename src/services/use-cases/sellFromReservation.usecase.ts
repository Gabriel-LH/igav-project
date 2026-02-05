// src/services/use-cases/sellFromReservation.usecase.ts

import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { SaleFromReservationDTO } from "@/src/interfaces/SaleFromReservationDTO";
import { processTransaction } from "../transactionServices";
import { useReservationStore } from "@/src/store/useReservationStore";

interface SellFromReservationInput {
  reservation: Reservation;
  reservationItems: ReservationItem[];
  customerId: string;
  selectedStocks: Record<string, string>;
  sellerId: string;
  financials: SaleFromReservationDTO["financials"];
  initialStatus: "pendiente_pago" | "pendiente_entrega";
  notes?: string;
}

export function createSaleFromReservationUseCase({
  reservation,
  reservationItems,
  selectedStocks,
  sellerId,
  financials,
  initialStatus,
  notes,
}: SellFromReservationInput) {
  const saleDTO: SaleFromReservationDTO = {
    type: "venta",
    status: initialStatus,
    reservationId: reservation.id,
    customerId: reservation.customerId,
    reservationItems: reservationItems.map((item) => ({
      reservationItemId: item.id,
      stockId: selectedStocks[item.id],
    })),
    sellerId,
    branchId: reservation.branchId,
    financials,
    notes,
  };

  const result = processTransaction(saleDTO);

  useReservationStore
    .getState()
    .updateStatus(reservation.id, "venta", "convertida");

  return {
    result,
    saleId: result.details.id, // 👈 CLAVE
    operationId: result.operation.id,
  };
}
