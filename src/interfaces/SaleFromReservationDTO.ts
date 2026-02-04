import { SaleDTO } from "./SaleDTO";

export interface SaleFromReservationDTO {
  type: "venta";

  status: "vendido" | "cancelado" | "pendiente_entrega" | "devuelto";
  reservationId: string;
  customerId: string;

  reservationItems: {
    reservationItemId: string;
    stockId: string;
  }[];

  sellerId: string;
  branchId: string;

  financials: SaleDTO["financials"]

  notes?: string;
}
