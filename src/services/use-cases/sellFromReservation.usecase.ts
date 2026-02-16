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
  notes?: string;
  status?: string;
}

export function createSaleFromReservationUseCase({
  reservation,
  reservationItems,
  selectedStocks,
  sellerId,
  financials,
  notes,
  status = "vendido_pendiente_entrega",
}: SellFromReservationInput) {
  const saleDTO: SaleFromReservationDTO = {
    type: "venta",
    status: status as SaleFromReservationDTO["status"],
    reservationId: reservation.id,
    customerId: reservation.customerId,
    reservationItems: reservationItems.map((item) => ({
      reservationItemId: item.id,
      // El viewer usa formato "id-0" para el primer item (y unicos)
      stockId: selectedStocks[`${item.id}-0`] || selectedStocks[item.id],
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
    saleId: result.details.id,
    operationId: result.operation.id,
  };
}
