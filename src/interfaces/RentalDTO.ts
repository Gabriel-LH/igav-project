import { BaseOperation } from "./BaseOperation";

export interface RentalDTO extends BaseOperation {
  type: "alquiler";
  status: "en_curso" | "devuelto" | "atrasado";
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date;
  items: {
    productId: string;
    productName: string;
    stockId: string;
    quantity: number;
    size: string;
    color: string;
    priceAtMoment: number;
  }[];
  financials: {
    totalRent: number;
    receivedAmount: number;
    keepAsCredit: boolean;
    paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
    guarantee: {
      type: "dinero" | "dni" | "joyas" | "reloj" | "otros" | "no_aplica";
      value?: string;
      description?: string;
    };
  };
}
