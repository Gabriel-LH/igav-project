import { create } from "zustand";
import { Sale } from "@/src/types/sales/type.sale";
import { SaleItem } from "@/src/types/sales/type.saleItem";

interface SaleStore {
  sales: Sale[];
  saleItems: SaleItem[];

  addSale: (sale: Sale, items: SaleItem[]) => void;

  getSaleById: (id: string) => Sale | undefined;

  updateSale: (id: string, data: Partial<Sale>) => void;

  cancelSale: (saleId: string, reason?: string) => void;

  returnSaleItem: (
    saleItemId: string,
    condition: "perfecto" | "dañado" | "manchado",
    restockingFee?: number,
  ) => void;
}

export const useSaleStore = create<SaleStore>((set, get) => ({
  sales: [],
  saleItems: [],

  addSale: (sale, items) =>
    set((state) => ({
      sales: [...state.sales, sale],
      saleItems: [...state.saleItems, ...items],
    })),

  getSaleById: (id) =>
    get().sales.find((s) => s.id === id),

  updateSale: (id, data) =>
    set((state) => ({
      sales: state.sales.map((s) =>
        s.id === id
          ? { ...s, ...data, updatedAt: new Date() }
          : s,
      ),
    })),

  cancelSale: (saleId, reason) =>
    set((state) => ({
      sales: state.sales.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: "cancelado",
              notes: reason,
              canceledAt: new Date(),
              updatedAt: new Date(),
            }
          : s,
      ),
    })),

  returnSaleItem: (saleItemId, condition, restockingFee = 0) =>
    set((state) => {
      const item = state.saleItems.find((i) => i.id === saleItemId);
      if (!item) return state;

      const updatedItems = state.saleItems.map((i) =>
        i.id === saleItemId
          ? {
              ...i,
              isReturned: true,
              returnCondition: condition,
              restockingFee,
            }
          : i,
      );

      const itemsOfSale = updatedItems.filter(
        (i) => i.saleId === item.saleId,
      );

      const allReturned = itemsOfSale.every((i) => i.isReturned);

      return {
        saleItems: updatedItems,
        sales: state.sales.map((s) =>
          s.id === item.saleId
            ? {
                ...s,
                status: allReturned ? "devuelto" : s.status,
                amountRefunded:
                  (s.amountRefunded || 0) + restockingFee,
                updatedAt: new Date(),
              }
            : s,
        ),
      };
    }),
}));
