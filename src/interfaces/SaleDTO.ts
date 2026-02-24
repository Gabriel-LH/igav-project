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
  }[];

  financials: {
    totalAmount: number;
    receivedAmount: number;
    keepAsCredit: boolean;
    totalPrice: number;
    paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
  };
  notes?: string;
}
