import { BaseOperation } from "./BaseOperation";

export interface RentalDTO extends BaseOperation {
  type: "alquiler";
  status: "en_curso" | "devuelto" | "atrasado";
  startDate: Date;
  endDate: Date;
  actualReturnDate?: Date;
  
  financials: {
    totalRent: number;
    paymentMethod: "cash" | "card" | "transfer" | "yape" | "plin";
    guarantee: {
      id: string; // Ya no es opcional en un alquiler
      type: "dinero" | "dni" | "joyas" | "reloj" | "otros" | "no_aplica";
      value?: string;
      description?: string;
    };
  };
}