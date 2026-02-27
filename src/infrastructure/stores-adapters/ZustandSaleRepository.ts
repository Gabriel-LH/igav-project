import { SaleRepository } from "../../domain/repositories/SaleRepository";
import { Sale } from "../../types/sales/type.sale";
import { SaleItem } from "../../types/sales/type.saleItem";
import { useSaleStore } from "../../store/useSaleStore";

export class ZustandSaleRepository implements SaleRepository {
  addSale(sale: Sale, saleItems: SaleItem[]): void {
    useSaleStore.getState().addSale(sale, saleItems);
  }

  getSaleById(id: string): Sale | undefined {
    return useSaleStore.getState().sales.find((s) => s.id === id);
  }

  getSaleWithItems(id: string): { items: SaleItem[] } & Sale {
    const sale = this.getSaleById(id);
    if (!sale) throw new Error("Sale not found");
    const items = useSaleStore
      .getState()
      .saleItems.filter((i) => i.saleId === id);
    return { ...sale, items };
  }

  getSaleByOperationId(operationId: string): Sale | undefined {
    return useSaleStore
      .getState()
      .sales.find((s) => s.operationId === operationId);
  }

  updateSale(id: string, data: Partial<Sale>): void {
    useSaleStore.getState().updateSale(id, data);
  }

  updateSaleItem(id: string, data: Partial<SaleItem>): void {
    const store = useSaleStore.getState();
    const items = store.saleItems.map((i) =>
      i.id === id ? { ...i, ...data } : i,
    );
    useSaleStore.setState({ saleItems: items });
  }
}
