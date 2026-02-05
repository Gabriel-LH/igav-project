import { differenceInHours } from "date-fns";
import { Sale } from "@/src/types/sales/type.sale";

export function canAnnulSale(sale: Sale) {
  return differenceInHours(new Date(), sale.createdAt) <= 24;
}

export function canReturnSale(sale: Sale) {
  return true; // o <= 7 días, si quieres
}
