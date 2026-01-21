// src/store/useReservationStore.ts
import { create } from "zustand";
import { ReservationDTO } from "../interfaces/reservationDTO";

type OperationType = "alquiler" | "venta";

interface ReservationStore {
  reservations: ReservationDTO[];
  operationType: OperationType;

  // Acciones principales
  setOperationType: (type: OperationType) => void;

  // Modificamos createReservation para que pueda notificar al inventario
  createReservation: (
    newReservation: ReservationDTO,
    updateStockFn?: (productId: string, qty: number, stockId?: string) => void,
  ) => void;

  // Gestión de estados (Consistente con tus Enums de Zod)
  updateStatus: (id: string, newStatus: string) => void;
  cancelReservation: (id: string) => void;
  completeReservation: (id: string) => void;

  // Específico para Alquileres
  returnReservation: (id: string, extraCharges?: number) => void;
  rearrangeReservation: (
    id: string,
    newStartDate: Date,
    newEndDate: Date,
  ) => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  reservations: [],
  operationType: "alquiler",

  setOperationType: (type) => set({ operationType: type }),

  createReservation: (newReservation, updateStockFn) => {
    // 1. Generamos un ID de operación único (como tu operationId: number)
    const tempId = `OP-${Math.floor(Math.random() * 1000000)}`;

    set((state) => ({
      reservations: [
        {
          ...newReservation,
          id: tempId,
          createdAt: new Date(),
        },
        ...state.reservations,
      ],
    }));

    // 2. Si pasamos la función de actualización de stock, la ejecutamos
    // Esto es lo que hará que las Cards se actualicen o desaparezcan
    if (updateStockFn) {
      updateStockFn(newReservation.productId, newReservation.quantity);
    }
  },

  updateStatus: (id, newStatus) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id ? { ...res, status: newStatus as any } : res,
      ),
    })),

  cancelReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id ? { ...res, status: "cancelada" as any } : res,
      ),
    })),

  completeReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id ? { ...res, status: "completada" as any } : res,
      ),
    })),

  returnReservation: (id, extraCharges = 0) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? {
              ...res,
              status: "completada" as any, // O "devuelta" según tu lógica
              financials: {
                ...res.financials,
                total: res.financials.total + extraCharges,
              },
            }
          : res,
      ),
    })),

  rearrangeReservation: (id, newStartDate, newEndDate) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? { ...res, startDate: newStartDate, endDate: newEndDate }
          : res,
      ),
    })),
}));
