// src/store/useReservationStore.ts
import { create } from "zustand";
import { Reservation } from "../types/reservation/type.reservation";
import { ReservationItem } from "../types/reservation/type.reservationItem";

interface ReservationStore {
  reservations: Reservation[];
  reservationItems: ReservationItem[];

  addReservation: (
    reservation: Reservation,
    reservationItems: ReservationItem[],
  ) => void;
  updateStatus: (id: string, status: Reservation["status"]) => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  reservations: [],
  reservationItems: [],

  addReservation: (reservation, reservationItems) =>
    set((state) => {
      console.log("🔵 [addReservation] Nueva reserva:", reservation);
      console.log("🔵 [addReservation] Nuevos items:", reservationItems);
      return {
        reservations: [reservation, ...state.reservations],
        reservationItems: [...reservationItems, ...state.reservationItems],
      };
    }),

  updateStatus: (id, status) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id ? { ...res, status, updatedAt: new Date() } : res,
      ),
    })),
}));
