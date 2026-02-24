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
    sizeId: string;
    colorId: string;
    priceAtMoment: number;
    listPrice?: number;
    discountAmount?: number;
    discountReason?: string;
    bundleId?: string;
    promotionId?: string;
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
    downPayment: number;
    pendingAmount: number;
    paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
  };
}
