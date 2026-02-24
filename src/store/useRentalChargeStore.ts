import { create } from "zustand";
import { z } from "zod";
import { rentalChargeSchema } from "@/src/types/rentals/rentalCharge";

type RentalCharge = z.infer<typeof rentalChargeSchema>;

interface RentalChargeStore {
  rentalCharges: RentalCharge[];
  addRentalCharge: (charge: RentalCharge) => void;
  addRentalCharges: (charges: RentalCharge[]) => void;
  getByRentalId: (rentalId: string) => RentalCharge[];
}

export const useRentalChargeStore = create<RentalChargeStore>((set, get) => ({
  rentalCharges: [],

  addRentalCharge: (charge) =>
    set((state) => ({
      rentalCharges: [...state.rentalCharges, charge],
    })),

  addRentalCharges: (charges) =>
    set((state) => ({
      rentalCharges: [...state.rentalCharges, ...charges],
    })),

  getByRentalId: (rentalId) =>
    get().rentalCharges.filter((charge) => charge.rentalId === rentalId),
}));
