import { BaseOperation } from "./BaseOperation";

export interface ReservationDTO extends BaseOperation {
  type: "reserva";
  status: "pendiente" | "confirmada" | "cancelada";
  reservationDateRange: {
    from: Date;
    to: Date;
  };
  financials: {
    totalPrice: number;
    downPayment: number; // El dinero que dejó para separar
    pendingAmount: number;
    paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
  };
}