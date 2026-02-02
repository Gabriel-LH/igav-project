import { BRANCH_MOCKS } from "../mocks/mock.branch";
import { USER_MOCK } from "../mocks/mock.user";
import { Client } from "../types/clients/type.client";
import { Guarantee } from "../types/guarantee/type.guarantee";
import { Product } from "../types/product/type.product";
import { Rental } from "../types/rentals/type.rentals";
import { RentalItem } from "../types/rentals/type.rentalsItem";

// Este es el tipo que tu tabla espera (el que definiste en Zod)
export interface RentalTableRow {
  id: string;
  branchName: string;
  sellerName: string;
  outDate: string;
  expectedReturnDate: string;
  cancelDate: string;
  nameCustomer: string;
  product: string;
  rent_unit: string;
  count: number;
  income: number;
  gurantee: string;
  guarantee_status: string;
  status: string;
  damage: string;
  returnDate: string;
}

export const mapRentalToTable = (
  customers: Client[],
  rentals: Rental[],
  guarantees: Guarantee[],
  rentalItems: RentalItem[],
  products: Product[],
): RentalTableRow[] => {
  return rentals.map((item) => {
    const parent = rentals.find((r) => r.id === item.id);

    const rentalItem = rentalItems.find((r) => r.rentalId === item.id);

    const product = products.find((p) => p.id === rentalItem?.productId);

    const branch = BRANCH_MOCKS.find((b) => b.id === parent?.branchId);

    const customer = customers.find((c) => c.id === parent?.customerId);

    const guarantee = guarantees.find((g) => g.id === parent?.guaranteeId);

    console.log("guarantee que llega en el adapter", guarantee);

    const seller = USER_MOCK[0];
    return {
      // El ID técnico se usa para la "key" de React, pero no se muestra
      id: item.id,
      branchName: branch?.name || "Principal",
      sellerName: seller?.name || "",
      outDate: parent?.outDate
        ? new Date(parent.outDate).toLocaleDateString()
        : "---",
      expectedReturnDate: parent?.expectedReturnDate
        ? new Date(parent.expectedReturnDate).toLocaleDateString()
        : "---",
      cancelDate: parent?.cancelDate
        ? new Date(parent.cancelDate).toLocaleDateString()
        : "---",
      returnDate: parent?.actualReturnDate
        ? new Date(parent.actualReturnDate).toLocaleDateString()
        : "---",
      nameCustomer: customer?.firstName + " " + customer?.lastName || "---",
      product: product?.name || `ID: ${rentalItem?.productId}`,
      rent_unit: product?.rent_unit || "---",
      count: rentalItem?.quantity || 0,
      income: rentalItem?.priceAtMoment || 0,
      gurantee: guarantee ? guarantee.value.toString() : "---",
      guarantee_status: guarantee?.status || "---",
      status: item.status,
      damage: rentalItem?.conditionIn || "---",
    };
  });
};
