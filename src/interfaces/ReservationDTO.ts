import { PaymentMethodType } from "../utils/status-type/PaymentMethodType";
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
    subtotal: number;
    totalDiscount: number;
    taxAmount?: number;
    totalAmount: number;
    receivedAmount: number;
    paymentMethod: PaymentMethodType;
    keepAsCredit?: boolean;
  };
}
