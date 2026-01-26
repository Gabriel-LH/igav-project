import { BaseOperation } from "./BaseOperation";

export interface ReservationDTO extends BaseOperation {
  type: "reserva";
  status: "pendiente" | "confirmada" | "cancelada";
  operationType: "venta" | "alquiler";
  reservationDateRange: {
    from: Date;
    to: Date;
  };
  financials: {
    receivedAmount?: number;
    keepAsCredit?: boolean;
    totalPrice: number;
    downPayment: number; // El dinero que dejó para separar
    pendingAmount: number;
    paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
  };
}