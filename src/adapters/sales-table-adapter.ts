import { BRANCH_MOCKS } from "../mocks/mock.branch";
import { USER_MOCK } from "../mocks/mock.user";
import { Client } from "../types/clients/type.client";
import { Product } from "../types/product/type.product";
import { Sale } from "../types/sales/type.sale";
import { SaleItem } from "../types/sales/type.saleItem";
import { generateProductsSummary } from "../utils/generateProductsSummary";

export interface SaleTableRow {
  id: string;
  amountRefunded: number;
  branchName: string;
  sellerName: string;
  outDate: string;
  realOutDate: string;
  createdAt: string;
  cancelDate: string;
  returnDate: string;
  nameCustomer: string;

  // Nuevos campos de agrupación
  summary: string;
  totalItems: number;
  itemsDetail: SaleItem[];

  // Campos legacy
  product: string; // Mapeado a summary
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
  return sales.map((sale) => {
    const branch = BRANCH_MOCKS.find((b) => b.id === sale.branchId);
    const customer = customers.find((c) => c.id === sale.customerId);
    const seller = USER_MOCK[0];

    // 1. Buscamos TODOS los items de esta venta
    const currentItems = salesItems.filter((s) => s.saleId === sale.id);

    // 2. Enriquecemos con nombres
    const itemsWithNames = currentItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return { ...item, productName: prod?.name };
    });

    // 3. Generamos resumen y conteo
    const summary = generateProductsSummary(itemsWithNames);
    const totalItems = currentItems.reduce(
      (acc, item) => acc + item.quantity,
      0,
    );

    return {
      id: sale.id,
      branchName: branch?.name || "Principal",
      sellerName: seller?.name || "",

      createdAt: sale.createdAt
        ? new Date(sale.createdAt).toLocaleDateString()
        : "---",
      saleDate: sale.saleDate
        ? new Date(sale.saleDate).toLocaleDateString()
        : "---",
      outDate: sale.outDate
        ? new Date(sale.outDate).toLocaleDateString()
        : "---",
      realOutDate: sale.realOutDate
        ? new Date(sale.realOutDate).toLocaleDateString()
        : "---",
      cancelDate: sale.canceledAt
        ? new Date(sale.canceledAt).toLocaleDateString()
        : "---",
      returnDate: sale.returnedAt
        ? new Date(sale.returnedAt).toLocaleDateString()
        : "---",
      amountRefunded: sale.amountRefunded || 0,
      nameCustomer: customer?.firstName + " " + customer?.lastName || "---",

      // Nuevos campos
      summary,
      totalItems,
      itemsDetail: currentItems,

      // Legacy
      product: summary, // <--- COMPATIBILIDAD
      restockingFee: 0, // No hay un único fee
      count: totalItems,
      income: sale.totalAmount, // Usamos totalAmount directo de la venta
      status: sale.status,
      damage: "---",
    };
  });
};
