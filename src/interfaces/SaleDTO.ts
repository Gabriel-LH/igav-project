import { BaseOperation } from "./BaseOperation";

export interface SaleDTO extends BaseOperation {
  type: "venta";
  status: "vendido";
  quantity: number;
  totalPrice: number;
  paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
}