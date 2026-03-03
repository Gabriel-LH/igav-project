import { SaleDTO } from "./SaleDTO";

export interface SaleFromReservationDTO {
  type: "venta";

  status: "vendido" | "reservado" | "cancelado" | "pendiente_entrega" | "pendiente_pago" | "devuelto";
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
