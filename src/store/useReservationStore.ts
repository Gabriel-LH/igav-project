// src/store/useReservationStore.ts
import { create } from 'zustand';
import { RESERVATIONS_MOCK } from '@/src/mocks/mock.reservation';

interface ReservationStore {
  reservations: any[];
  // Acciones
  deliverReservation: (id: string) => void;
  updateStatus: (id: string, newStatus: string) => void;
  returnReservation: (id: string, extraCharges?: number) => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  reservations: RESERVATIONS_MOCK, // Estado inicial con los mocks

  deliverReservation: (id) => set((state) => ({
    reservations: state.reservations.map((res) =>
      res.id === id ? { ...res, status: 'entregado', updatedAt: new Date() } : res
    ),
  })),

  updateStatus: (id, newStatus) => set((state) => ({
    reservations: state.reservations.map((res) =>
      res.id === id ? { ...res, status: newStatus, updatedAt: new Date() } : res
    ),
  })),

  returnReservation: (id, extraCharges = 0) => set((state) => ({
  reservations: state.reservations.map((res) =>
    res.id === id 
      ? { 
          ...res, 
          status: 'finalizado', 
          actualReturnDate: new Date(),
          total: (res.total || 0) + extraCharges // Sumamos la mora al total cobrado
        } 
      : res
  ),
})),
}));