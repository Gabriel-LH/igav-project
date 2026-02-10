import { BaseOperation } from "./BaseOperation";

export interface RentalDTO extends BaseOperation {
  type: "alquiler";
  status: "alquilado" | "devuelto" | "atrasado" | "reservado_fisico";
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
      type?: "dinero" | "dni" | "joyas" | "reloj" | "otros" | "no_aplica" | "por_cobrar";
      value?: string;
      description?: string;
    };
  };
}
