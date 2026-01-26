import { create } from "zustand";
import { Rental } from "../types/rentals/type.rentals"; // Define tus tipos aquí
import { RentalItem } from "../types/rentals/type.rentalsItem";
import { RentalDTO } from "../interfaces/RentalDTO";
import { useGuaranteeStore } from "./useGuaranteeStore";

interface RentalStore {
  rentals: Rental[];
  rentalItems: RentalItem[];

  // Acciones principales
  createDirectRental: (rental: Rental, rentalItems: RentalItem[]) => void;
  createRentalFromReservation: (reservation: any, selectedItems: any[]) => void;
  processReturn: (itemId: string, status: string, penalty: number) => void;
}

export const useRentalStore = create<RentalStore>((set) => ({
  rentals: [],
  rentalItems: [],

  createDirectRental: (rental, items) =>
  set((state) => ({
    rentals: [...state.rentals, rental],
    rentalItems: [...state.rentalItems, ...items],
  })),

  createRentalFromReservation: (reservation, selectedItems) =>
    set((state) => {
      const newRentalId = `RITM-${Date.now()}-${reservation.stockId}`;
      const now = new Date();

      // 1. CREAR EL PADRE (Rental)
      const newRental: Rental = {
        id: newRentalId,
        operationId: reservation.operationId, // Generamos un ID temporal o viene de la transacción
        reservationId: reservation.id,
        customerId: reservation.customerId,
        branchId: reservation.branchId,
        outDate: now,
        expectedReturnDate: new Date(reservation.endDate),
        status: "en_curso",
        guaranteeId: `GUA-${Math.random().toString(36).substr(2, 5)}`, // Obligatorio en tu Zod
        totalPenalty: 0,
        createdAt: now, // Obligatorio en tu Zod
        updatedAt: now, // Obligatorio en tu Zod
        notes: reservation.notes || "",
      };

      // 2. CREAR LOS HIJOS (RentalItems)
      const newItems: RentalItem[] = selectedItems.map((item) => ({
        id: `R-ITEM-${Math.random().toString(36).substr(2, 9)}`,
        rentalId: newRentalId,
        operationId: newRental.operationId, // Mismo ID que el padre
        productId: item.productId,
        stockId: item.stockId,
        size: item.size,
        color: item.color,
        priceAtMoment: item.priceAtMoment,
        quantity: item.quantity || 1,
        conditionOut: "Perfecto", // Valor inicial
        itemStatus: "alquilado",
        notes: "",
      }));

      return {
        rentals: [...state.rentals, newRental],
        rentalItems: [...state.rentalItems, ...newItems],
      };
    }),

  processReturn: (itemId, status, penalty = 0) =>
    set((state) => {
      // Buscamos el item para saber quién es su padre (rentalId)
      const itemToReturn = state.rentalItems.find((i) => i.id === itemId);
      if (!itemToReturn) return state;

      // Actualizamos el item a "devuelto"
      const updatedItems = state.rentalItems.map((item) =>
        item.id === itemId
          ? { ...item, itemStatus: "devuelto" as any, conditionIn: status }
          : item,
      );

      // Buscamos el alquiler padre para sumarle la penalidad si existe
      const item = state.rentalItems.find((i) => i.id === itemId);
      const updatedRentals = state.rentals.map((rental) => {
        if (rental.id === item?.rentalId) {
          return {
            ...rental,
            totalPenalty: (rental.totalPenalty || 0) + penalty,
            status: "finalizado" as any, // Podrías verificar si todos los items se devolvieron
            updatedAt: new Date(),
          };
        }
        return rental;
      });

      return {
        rentalItems: updatedItems,
        rentals: updatedRentals,
      };
    }),
}));
