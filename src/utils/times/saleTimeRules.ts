import { differenceInHours } from "date-fns";
import { Sale } from "@/src/types/sales/type.sale";

export function canAnnulSale(sale: Sale, maxCancelHours = 24) {
  return differenceInHours(new Date(), sale.createdAt) <= maxCancelHours;
}

export function canReturnSale(sale: Sale, maxReturnHours = 72) {
  const baseDate = sale.saleDate || sale.createdAt;
  return differenceInHours(new Date(), baseDate) <= maxReturnHours;
}
