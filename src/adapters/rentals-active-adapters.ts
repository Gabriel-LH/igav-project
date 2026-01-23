import { Rental } from "../types/rentals/type.rentals";
import { RentalItem } from "../types/rentals/type.rentalsItem";

// Este es el tipo que tu tabla espera (el que definiste en Zod)
export interface RentalTableRow {
  id: string;
  branchName: string;
  sellerName: string;
  outDate: string;
  expectedReturnDate: string;
  nameCustomer: string;
  product: string;
  rent_unit: string;
  count: number;
  income: number;
  gurantee: string;
  guarantee_status: string;
  status: string;
}

export const mapRentalToTable = (
  rentals: Rental[],
  rentalItems: RentalItem[]
): RentalTableRow[] => {
  return rentalItems.map((item) => {
    const parent = rentals.find((r) => r.id === item.rentalId);

    return {
      // El ID técnico se usa para la "key" de React, pero no se muestra
      id: item.operationId, 
      branchName: parent?.branchId || "Principal",
      sellerName: "Admin", 
      outDate: parent?.outDate ? new Date(parent.outDate).toLocaleDateString() : "---",
      expectedReturnDate: parent?.expectedReturnDate ? new Date(parent.expectedReturnDate).toLocaleDateString() : "---",
      nameCustomer: `Cliente ${parent?.customerId || 'N/A'}`,
      product: `ID: ${item.productId}`, 
      rent_unit: "Evento",
      count: item.quantity,
      income: item.priceAtMoment,
      gurantee: "S/. 0.00",
      guarantee_status: "Pendiente",
      status: item.itemStatus,
    };
  });
};