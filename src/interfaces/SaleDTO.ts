import { PaymentMethodType } from "../utils/status-type/PaymentMethodType";
import { BaseOperation } from "./BaseOperation";

export interface SaleDTO extends BaseOperation {
  type: "venta";
  status:
    | "vendido"
    | "cancelado"
    | "pendiente_entrega"
    | "devuelto"
    | "vendido_pendiente_entrega";
  customerId: string;
  customerName: string;
  sellerId: string;
  branchId: string;

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

  financials: {
    subtotal: number;
    totalDiscount: number;
    taxAmount?: number;
    totalAmount: number;
    receivedAmount: number;
    keepAsCredit: boolean;
    paymentMethod: PaymentMethodType;
  };
  notes?: string;
}
