import { BRANCH_MOCKS } from "../mocks/mock.branch";
import { USER_MOCK } from "../mocks/mock.user";
import { Client } from "../types/clients/type.client";
import { Product } from "../types/product/type.product";
import { Sale } from "../types/sales/type.sale";
import { SaleItem } from "../types/sales/type.saleItem";

// Este es el tipo que tu tabla espera (el que definiste en Zod)
export interface SaleTableRow {
  id: string;
  branchName: string;
  sellerName: string;
  outDate: string;
  realOutDate: string;
  cancelDate: string;
  returnDate: string;
  nameCustomer: string;
  product: string;
  count: number;
  income: number;
  status: string;
  damage: string;
}

export const mapSaleToTable = (
  customers: Client[],
  sales: Sale[],
  salesItems: SaleItem[],
  products: Product[],
): SaleTableRow[] => {
  return sales.map((item) => {

    const parent = sales.find((s) => s.id === item.id);

    const saleItem = salesItems.find((s) => s.saleId === item.id);

    const product = products.find((p) => p.id === saleItem?.productId);

    const branch = BRANCH_MOCKS.find((b) => b.id === parent?.branchId);

    const customer = customers.find((c) => c.id === parent?.customerId);

    const seller = USER_MOCK[0];

    console.log("Data que llega a sales table adapter",item);

    
    return {
      // El ID técnico se usa para la "key" de React, pero no se muestra
      id: item.id,
      branchName: branch?.name || "Principal",
      sellerName: seller?.name || "",
      createdAt: parent?.createdAt
        ? new Date(parent.createdAt).toLocaleDateString()
        : "---",
      saleDate: parent?.saleDate
        ? new Date(parent.saleDate).toLocaleDateString()
        : "---",
      outDate: parent?.outDate
        ? new Date(parent.outDate).toLocaleDateString()
        : "---",
      realOutDate: parent?.realOutDate
        ? new Date(parent.realOutDate).toLocaleDateString()
        : "---",
      cancelDate: parent?.canceledAt
        ? new Date(parent.canceledAt).toLocaleDateString()
        : "---",
      returnDate: parent?.returnedAt
        ? new Date(parent.returnedAt).toLocaleDateString()
        : "---",
      nameCustomer: customer?.firstName + " " + customer?.lastName || "---",
      product: product?.name || `ID: ${saleItem?.productId}`,
      count: saleItem?.quantity || 0,
      income: saleItem?.priceAtMoment || 0,
      status: item.status,
      damage: saleItem?.returnCondition || "---",
    };
  });
};
