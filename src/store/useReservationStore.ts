// src/store/useReservationStore.ts
import { create } from "zustand";
import { Reservation } from "../types/reservation/type.reservation";
import { ReservationItem } from "../types/reservation/type.reservationItem";

interface ReservationStore {
  // state
  reservations: Reservation[];
  reservationItems: ReservationItem[];

  // actions
  addReservation: (
    reservation: Reservation,
    reservationItems: ReservationItem[],
  ) => void;

  updateStatus: (
    id: string,
    operationType: "alquiler" | "venta",
    status: Reservation["status"],
  ) => void;

  cancelReservation: (id: string) => void;

  rearrangeReservation: (
    id: string,
    newStartDate: Date,
    newEndDate: Date,
  ) => void;

  updateReservationItemStatus: (
    id: string,
    status: ReservationItem["itemStatus"],
  ) => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  // =========================
  // STATE
  // =========================
  reservations: [],
  reservationItems: [],

  // =========================
  // ACTIONS
  // =========================

  /**
   * Crear una reserva con sus items
   * (se usa en processTransaction cuando type === "reserva")
   */
  addReservation: (reservation, reservationItems) =>
    set((state) => ({
      reservations: [reservation, ...state.reservations],
      reservationItems: [...reservationItems, ...state.reservationItems],
    })),

  /**
   * Actualiza el estado general de la reserva
   * Ej: confirmada → convertida / cancelada
   */
  updateStatus: (id, operationType, status) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? { ...res, operationType, status, updatedAt: new Date() }
          : res,
      ),
    })),

  /**
   * Cancela una reserva
   */
  cancelReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? { ...res, status: "cancelada", updatedAt: new Date() }
          : res,
      ),
    })),

  /**
   * Reprograma fechas de la reserva
   */
  rearrangeReservation: (id, newStartDate, newEndDate) =>
    set((state) => ({
      reservations: state.reservations.map((res) =>
        res.id === id
          ? {
              ...res,
              startDate: newStartDate,
              endDate: newEndDate,
              updatedAt: new Date(),
            }
          : res,
      ),
    })),

  /**
   * Actualiza el estado de un item de reserva
   * Ej: confirmada → convertida
   */
  updateReservationItemStatus: (id, status) =>
    set((state) => ({
      reservationItems: state.reservationItems.map((item) =>
        item.id === id
          ? { ...item, itemStatus: status }
          : item,
      ),
    })),
}));
