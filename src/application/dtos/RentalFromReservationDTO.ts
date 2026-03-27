import { RentalDTO } from "./RentalDTO";

// interfaces/RentalFromReservationDTO.ts
export interface RentalFromReservationDTO {
  type: "alquiler";
  tenantId: string;

  reservationId: string;
  reservationItems: {
    reservationItemId: string;
    stockId: string;
  }[];

  customerId: string;
  sellerId: string;
  branchId: string;

  startDate: Date;
  endDate: Date;
  status: "alquilado" | "devuelto" | "atrasado" | "con_daños" | "reservado_fisico" | "perdido" | "anulado";

  financials: RentalDTO["financials"];

  configSnapshot?: unknown;
  policySnapshot?: unknown;
  configVersion?: Date;
  policyVersion?: number;
}
