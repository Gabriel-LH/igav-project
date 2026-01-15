import { create } from "zustand";

interface InventoryStore {
  reservations: any[];
  processReturn: (
    reservationId: string,
    items: any[],
    hasDamage: boolean
  ) => void;
}


export const useInventoryStore = create<InventoryStore>((set) => ({
  reservations: [],

  processReturn: (reservationId, items, hasDamage) =>
    set((state) => {
      // 1. Finalizar la reserva
      const updatedReservations = state.reservations.map((res) =>
        res.id === reservationId
          ? { ...res, status: "finalizado" }
          : res
      );

      // 2. Determinar destino del stock
      const newStatus = hasDamage ? "mantenimiento" : "lavanderia";

      // 👉 Aquí luego podrás:
      // - recorrer items
      // - actualizar stock por item.productId
      // - setear status = newStatus

      return {
        reservations: updatedReservations,
      };
    }),
}));
