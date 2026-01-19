import { create } from "zustand";
import { Rental } from "../types/rentals/type.rentals"; // Define tus tipos aquí
import { RentalItem } from "../types/rentals/type.rentalsItem";
interface RentalStore {
  rentals: Rental[];
  rentalItems: RentalItem[];
  
  // Acciones principales
  createRentalFromReservation: (reservation: any, selectedItems: any[]) => void;
  processReturn: (rentalId: string, itemId: string, status: string) => void;
}

export const useRentalStore = create<RentalStore>((set) => ({
  rentals: [],
  rentalItems: [],

  createRentalFromReservation: (reservation, selectedItems) => set((state) => {
    const newRentalId = `RENT-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    // 1. CREAR EL PADRE (Rental)
    const newRental: Rental = {
      id: newRentalId,
      operationId: Date.now(), // Generamos un ID temporal o viene de la transacción
      reservationId: reservation.id,
      customerId: reservation.customerId,
      branchId: reservation.branchId,
      outDate: now,
      expectedReturnDate: new Date(reservation.endDate),
      status: "en_curso",
      guaranteeId: `GUA-${Math.random().toString(36).substr(2, 5)}`, // Obligatorio en tu Zod
      totalPenalty: 0,
      createdAt: now,    // Obligatorio en tu Zod
      updatedAt: now,    // Obligatorio en tu Zod
      notes: reservation.notes || ""
    };

    // 2. CREAR LOS HIJOS (RentalItems)
    const newItems: RentalItem[] = selectedItems.map(item => ({
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
      notes: ""
    }));

    return {
      rentals: [...state.rentals, newRental],
      rentalItems: [...state.rentalItems, ...newItems]
    };
  }),

  processReturn: (rentalId, itemId, status) => set((state) => ({
    rentalItems: state.rentalItems.map(item => 
      item.id === itemId 
        ? { ...item, itemStatus: status as any, conditionIn: "Revisado" } 
        : item
    )
  }))
}));