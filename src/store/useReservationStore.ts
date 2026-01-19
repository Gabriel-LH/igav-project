// src/store/useReservationStore.ts
import { create } from "zustand";
import { RESERVATIONS_MOCK } from "@/src/mocks/mock.reservation";

interface ReservationStore {
  reservations: any[];
  // Acciones
  completeReservation: (id: string) => void;
  updateStatus: (id: string, newStatus: string) => void;
  returnReservation: (id: string, extraCharges?: number) => void;
  cancelReservation: (id: string) => void;
  rearrangeReservation: (
    id: string,
    newStartDate: Date,
    newEndDate: Date
  ) => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  reservations: RESERVATIONS_MOCK, // Estado inicial con los mocks

  completeReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? { ...res, status: "completada", updatedAt: new Date() }
          : res
      ),
    })),

  updateStatus: (id, newStatus) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? { ...res, status: newStatus, updatedAt: new Date() }
          : res
      ),
    })),

  returnReservation: (id, extraCharges = 0) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? {
              ...res,
              status: "devuelta",
              actualReturnDate: new Date(),
              total: (res.total || 0) + extraCharges, // Sumamos la mora al total cobrado
            }
          : res
      ),
    })),
  cancelReservation: (id: string) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id ? { ...res, status: "cancelada" } : res
      ),
    })),

  rearrangeReservation: (id: string, newStartDate: Date, newEndDate: Date) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? { ...res, startDate: newStartDate, endDate: newEndDate }
          : res
      ),
    })),
}));
