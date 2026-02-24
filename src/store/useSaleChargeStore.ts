import { create } from "zustand";
import { z } from "zod";
import { saleChargeSchema } from "@/src/types/sales/saleCharge";

type SaleCharge = z.infer<typeof saleChargeSchema>;

interface SaleChargeStore {
  saleCharges: SaleCharge[];
  addSaleCharge: (charge: SaleCharge) => void;
  addSaleCharges: (charges: SaleCharge[]) => void;
  getBySaleId: (saleId: string) => SaleCharge[];
}

export const useSaleChargeStore = create<SaleChargeStore>((set, get) => ({
  saleCharges: [],

  addSaleCharge: (charge) =>
    set((state) => ({
      saleCharges: [...state.saleCharges, charge],
    })),

  addSaleCharges: (charges) =>
    set((state) => ({
      saleCharges: [...state.saleCharges, ...charges],
    })),

  getBySaleId: (saleId) =>
    get().saleCharges.filter((charge) => charge.saleId === saleId),
}));
