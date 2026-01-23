import { create } from "zustand";
import { Rental } from "../types/rentals/type.rentals"; // Define tus tipos aquí
import { RentalItem } from "../types/rentals/type.rentalsItem";
import { RentalDTO } from "../interfaces/RentalDTO";
import { useGuaranteeStore } from "./useGuaranteeStore";

interface RentalStore {
  rentals: Rental[];
  rentalItems: RentalItem[];

  // Acciones principales
  createDirectRental: (transaction: RentalDTO) => void;
  createRentalFromReservation: (reservation: any, selectedItems: any[]) => void;
  processReturn: (itemId: string, status: string, penalty: number) => void;
}

export const useRentalStore = create<RentalStore>((set) => ({
  rentals: [],
  rentalItems: [],

  createDirectRental: (transaction: RentalDTO) =>
    set((state) => {
      const now = new Date();
      // Generamos un ID de alquiler si el DTO no trae uno específico para la renta
      const rentalId = `RENT-${transaction.id || Math.random().toString(36).substr(2, 5)}`;

      // 1. EL PADRE (Rental): Adaptamos los campos del DTO a la interfaz Rental
      const newRental: Rental = {
        id: rentalId,
        operationId: transaction.operationId, // ID numérico de operación que pide tu tipo
        reservationId: transaction.id || "",
        customerId: transaction.customerId,
        branchId: transaction.branchId,
        outDate: transaction.startDate, // Usamos la fecha de inicio del DTO
        expectedReturnDate: transaction.endDate, // Usamos la fecha de fin del DTO
        status: "en_curso",

        // Mapeamos la garantía del DTO al campo guaranteeId o similar
        // Si tu tipo Rental pide un ID de garantía, usamos el del DTO o creamos uno vinculado
        guaranteeId: transaction.financials.guarantee.id!,

        totalPenalty: 0,
        createdAt: transaction.createdAt || now,
        updatedAt: now,
        notes: transaction.notes || "",
      };

      // 2. EL HIJO (RentalItem): Basado en los datos físicos del DTO
      const newItem: RentalItem = {
        // USAMOS EL ID DEL DTO (el de la reserva) para que sea fácil de encontrar luego
        id: transaction.id || `R-ITEM-${transaction.stockId}`,
        rentalId: rentalId,
        operationId: newRental.operationId,
        productId: transaction.productId,
        stockId: transaction.stockId,
        size: transaction.size,
        color: transaction.color,
        priceAtMoment: transaction.financials.totalRent,
        quantity: transaction.quantity || 1,
        conditionOut: "Excelente",
        itemStatus: "alquilado",
        notes: transaction.notes || "",
      };

      if (transaction.type === "alquiler") {
        useGuaranteeStore.getState().addGuarantee({
          id: newRental.guaranteeId,
          customerId: transaction.customerId,
          value: Number(transaction.financials.guarantee.value) || 0,
          type: transaction.financials.guarantee.type,
          status: "custodia",
          createdAt: new Date(),
          notes: `Garantía de renta ${newRental.id}`,
        } as any);
      }

      return {
        rentals: [...state.rentals, newRental],
        rentalItems: [...state.rentalItems, newItem],
      };
    }),

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
