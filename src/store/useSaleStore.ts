import { create } from "zustand";
import { Sale, SaleWithItems } from "@/src/types/sales/type.sale";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { useSaleChargeStore } from "./useSaleChargeStore";

interface SaleStore {
  sales: Sale[];
  saleItems: SaleItem[];

  addSale: (sale: Sale, items: SaleItem[]) => void;

  getSaleById: (id: string) => Sale | undefined;
  getSaleWithItems: (id: string) => SaleWithItems;

  updateSale: (id: string, data: Partial<Sale>) => void;

  cancelSale: (saleId: string, reason?: string) => void;

  updateSaleItem: (saleItemId: string, data: Partial<SaleItem>) => void;
}

export const useSaleStore = create<SaleStore>((set, get) => ({
  sales: [],
  saleItems: [],

  addSale: (sale, items) => {
    console.log("RECIBIENDO EN STORE:", sale);
    set((state) => ({
      sales: [...state.sales, sale],
      saleItems: [
        ...state.saleItems,
        ...items.map((i) => ({
          ...i,
          isReturned: false, // 👈 CRUCIAL
        })),
      ],
    }));
  },
  getSaleById: (id) => get().sales.find((s) => s.id === id),

  updateSale: (id, data) =>
    set((state) => ({
      sales: state.sales.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date() } : s,
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

  getSaleWithItems: (id) => {
    const sale = get().sales.find((s) => s.id === id);
    if (!sale) {
      throw new Error("Venta no encontrada");
    }

    const items = get().saleItems.filter((item) => item.saleId === id);
    const charges = useSaleChargeStore.getState().getBySaleId(id);

    return {
      ...sale,
      items,
      charges,
    };
  },

  updateSaleItem: (saleItemId, data) =>
    set((state) => ({
      saleItems: state.saleItems.map((item) =>
        item.id === saleItemId ? { ...item, ...data } : item,
      ),
    })),
}));
