import { BaseOperation } from "./BaseOperation";

export interface ReservationDTO extends BaseOperation {
  type: "reserva";
  status: "pendiente" | "confirmada" | "cancelada";
  operationType: "venta" | "alquiler";
  items: {
    productId: string;
    productName: string;
    stockId: string;
    quantity: number;
    size: string;
    color: string;
    priceAtMoment: number;
  }[];
  reservationDateRange: {
    from: Date;
    to: Date;
    hourFrom: string;
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