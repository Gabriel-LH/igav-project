import { Sale } from "../../../types/sales/type.sale";
import { SaleItem } from "../../../types/sales/type.saleItem";

export interface SaleRepository {
  addSale(sale: Sale, saleItems: SaleItem[], discountsApplied?: any[]): Promise<void>;
  addSaleItemStatusHistory(entries: Array<{
    tenantId: string;
    saleItemId: string;
    fromStatus: string;
    toStatus: string;
    reason?: string;
    changedBy?: string;
    createdAt?: Date;
  }>): Promise<void>;
  getSaleById(id: string): Promise<Sale | undefined>;
  getSaleWithItems(id: string): Promise<{ items: SaleItem[] } & Sale>;
  getSaleByOperationId(operationId: string): Promise<Sale | undefined>;
  updateSale(id: string, data: Partial<Sale>): Promise<void>;
  updateSaleItem(id: string, data: Partial<SaleItem>): Promise<void>;
  getSales(): Promise<Sale[]>;
  getSaleItems(): Promise<SaleItem[]>;
}
