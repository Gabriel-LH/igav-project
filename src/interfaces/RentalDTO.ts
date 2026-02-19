import { BaseOperation } from "./BaseOperation";

export interface RentalDTO extends BaseOperation {
  type: "alquiler";
  status:
    | "alquilado"
    | "reservado"
    | "vendido_pendiente_entrega"
    | "devuelto"
    | "atrasado"
    | "reservado_fisico";
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date;
  items: {
    id?: string; // RentalItem ID
    productId: string;
    productName: string;
    stockId: string;
    quantity: number;
    sizeId: string;
    colorId: string;
    priceAtMoment: number;
  }[];
  financials: {
    totalRent: number;
    receivedAmount: number;
    keepAsCredit: boolean;
    paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
    guarantee: {
      type?:
        | "dinero"
        | "dni"
        | "joyas"
        | "reloj"
        | "otros"
        | "no_aplica"
        | "por_cobrar";
      value?: string;
      description?: string;
    };
  };
}
