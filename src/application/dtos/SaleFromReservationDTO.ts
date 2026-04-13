import { SaleDTO } from "./SaleDTO";

export interface SaleFromReservationDTO {
  type: "venta";
  tenantId: string;

  status: "vendido" | "reservado" | "cancelado" | "pendiente_entrega" | "pendiente_pago" | "devuelto";
  reservationId: string;
  customerId: string;
  customerMode?: "registered" | "general";

  reservationItems: {
    reservationItemId: string;
    stockId?: string;
    inventoryItemId?: string;
  }[];

  sellerId: string;
  branchId: string;

  financials: SaleDTO["financials"]

  notes?: string;

  configSnapshot?: unknown;
  policySnapshot?: unknown;
  configVersion?: Date;
  policyVersion?: number;
}
