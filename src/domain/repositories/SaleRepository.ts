import { Sale } from "../../types/sales/type.sale";
import { SaleItem } from "../../types/sales/type.saleItem";

export interface SaleRepository {
  addSale(sale: Sale, saleItems: SaleItem[]): void;
  getSaleById(id: string): Sale | undefined;
  getSaleWithItems(id: string): { items: SaleItem[] } & Sale;
  getSaleByOperationId(operationId: string): Sale | undefined;
  updateSale(id: string, data: Partial<Sale>): void;
  updateSaleItem(id: string, data: Partial<SaleItem>): void;
}
