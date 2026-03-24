import { Sale } from "../../../types/sales/type.sale";
import { SaleItem } from "../../../types/sales/type.saleItem";

export interface SaleRepository {
  addSale(sale: Sale, saleItems: SaleItem[]): Promise<void>;
  getSaleById(id: string): Promise<Sale | undefined>;
  getSaleWithItems(id: string): Promise<{ items: SaleItem[] } & Sale>;
  getSaleByOperationId(operationId: string): Promise<Sale | undefined>;
  updateSale(id: string, data: Partial<Sale>): Promise<void>;
  updateSaleItem(id: string, data: Partial<SaleItem>): Promise<void>;
  getSales(): Promise<Sale[]>;
  getSaleItems(): Promise<SaleItem[]>;
}
