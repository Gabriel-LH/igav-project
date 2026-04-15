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
    variantId: string;
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
    creditAppliedAmount?: number;
    paymentMethod?: string;
    paymentMethodId?: string;
    creditPaymentMethodId?: string;
    keepAsCredit?: boolean;
  };
}
