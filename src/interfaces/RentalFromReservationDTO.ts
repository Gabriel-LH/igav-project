import { RentalDTO } from "./RentalDTO";

// interfaces/RentalFromReservationDTO.ts
export interface RentalFromReservationDTO {
  type: "alquiler";

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
  status: "en_curso" | "devuelto" | "atrasado" | "con_daños" | "perdido" | "anulado";

  financials: RentalDTO["financials"];
}
