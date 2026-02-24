// src/store/useRentalStore.ts
import { create } from "zustand";
import { Rental, RentalWithDetails } from "../types/rentals/type.rentals";
import { RentalItem } from "../types/rentals/type.rentalsItem";
import { useRentalChargeStore } from "./useRentalChargeStore";

interface RentalStore {
  rentals: Rental[];
  rentalItems: RentalItem[];

  addRental: (rental: Rental, items: RentalItem[]) => void;

  getRentalById: (id: string) => Rental | undefined;
  getRentalWithDetails: (id: string) => RentalWithDetails;

  updateRental: (id: string, data: Partial<Rental>) => void;

  cancelRental: (rentalId: string, reason?: string) => void;

  processReturnItem: (
    rentalItemId: string,
    conditionIn: string,
    penalty?: number,
  ) => void;
}

export const useRentalStore = create<RentalStore>((set, get) => ({
  rentals: [],
  rentalItems: [],

  addRental: (rental, items) =>
    set((state) => ({
      rentals: [...state.rentals, rental],
      rentalItems: [...state.rentalItems, ...items],
    })),

  getRentalById: (id) => get().rentals.find((r) => r.id === id),

  getRentalWithDetails: (id) => {
    const rental = get().rentals.find((r) => r.id === id);
    if (!rental) {
      throw new Error("Rental no encontrado");
    }

    const items = get().rentalItems.filter((item) => item.rentalId === id);
    const charges = useRentalChargeStore.getState().getByRentalId(id);

    return {
      ...rental,
      items,
      charges,
    };
  },

  updateRental: (id, data) =>
    set((state) => ({
      rentals: state.rentals.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date() } : r,
      ),
    })),

  cancelRental: (rentalId, reason = "Cancelado por error") =>
    set((state) => ({
      rentals: state.rentals.map((r) =>
        r.id === rentalId
          ? {
              ...r,
              status: "anulado",
              notes: reason,
              updatedAt: new Date(),
              cancelDate: new Date(),
            }
          : r,
      ),
      rentalItems: state.rentalItems.map((item) =>
        item.rentalId === rentalId
          ? { ...item, itemStatus: "devuelto" }
          : item,
      ),
    })),

  processReturnItem: (rentalItemId, conditionIn, penalty = 0) =>
    set((state) => {
      const item = state.rentalItems.find((i) => i.id === rentalItemId);
      if (!item) return state;

      const updatedItems = state.rentalItems.map((i) =>
        i.id === rentalItemId
          ? {
              ...i,
              itemStatus: "devuelto" as any,
              conditionIn,

            }
          : i,
      );

      const itemsOfRental = updatedItems.filter(
        (i) => i.rentalId === item.rentalId
      );


      const allReturned = itemsOfRental
        .filter((i) => i.rentalId === item.rentalId)
        .every((i) => i.itemStatus === "devuelto");

      return {
        rentalItems: updatedItems,
        rentals: state.rentals.map((r) =>
          r.id === item.rentalId
            ? {
                ...r,
                status: allReturned ? "devuelto" : r.status,
                updatedAt: new Date(),
              }
            : r,
        ),
      };
    }),
}));
