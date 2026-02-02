import { SaleDTO } from "./SaleDTO";

export interface SaleFromReservationDTO {
  type: "venta";

  reservationId: string;

  reservationItems: {
    reservationItemId: string;
    stockId: string;
  }[];

  sellerId: string;
  branchId: string;

  paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
  receivedAmount: number;

  financials: SaleDTO["financials"]

  notes?: string;
}
