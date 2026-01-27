// src/store/useRentalStore.ts
import { create } from "zustand";
import { Rental } from "../types/rentals/type.rentals";
import { RentalItem } from "../types/rentals/type.rentalsItem";
import { useGuaranteeStore } from "./useGuaranteeStore";

interface RentalStore {
  rentals: Rental[];
  rentalItems: RentalItem[];

  addRental: (rental: Rental, items: RentalItem[]) => void;

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

  // 🔹 Crear alquiler (ya armado desde transaction)
  addRental: (rental, items) =>
    set((state) => ({
      rentals: [...state.rentals, rental],
      rentalItems: [...state.rentalItems, ...items],
    })),

  // ❌ Cancelar alquiler (error humano)
  cancelRental: (rentalId, reason = "Cancelado por error") =>
    set((state) => {
      const rental = state.rentals.find((r) => r.id === rentalId);
      if (!rental) return state;

      // liberar garantía si existe
      if (rental.guaranteeId) {
        useGuaranteeStore.getState().releaseGuarantee(rental.guaranteeId);
      }

      return {
        rentals: state.rentals.map((r) =>
          r.id === rentalId
            ? {
                ...r,
                status: "cancelado" as any,
                notes: reason,
                updatedAt: new Date(),
              }
            : r,
        ),

        rentalItems: state.rentalItems.map((item) =>
          item.rentalId === rentalId
            ? { ...item, itemStatus: "cancelado" as any }
            : item,
        ),
      };
    }),

  // 🔁 Devolver item individual
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

      const rentalItemsOfRental = updatedItems.filter(
        (i) => i.rentalId === item.rentalId,
      );

      const allReturned = rentalItemsOfRental.every(
        (i) => i.itemStatus === "devuelto",
      );

      const updatedRentals = state.rentals.map((r) => {
        if (r.id !== item.rentalId) return r;

        return {
          ...r,
          totalPenalty: (r.totalPenalty || 0) + penalty,
          status: allReturned ? "devuelto" : r.status,
          updatedAt: new Date(),
        };
      });

      return {
        rentalItems: updatedItems,
        rentals: updatedRentals,
      };
    }),
}));
