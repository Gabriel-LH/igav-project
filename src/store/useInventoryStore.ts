import { create } from "zustand";
import { STOCK_MOCK } from "../mocks/mock.stock";


type StockStatus = "disponible" | "mantenimiento" | "alquilado" | "lavanderia" | "baja" | "agotado" | "vendido";
interface InventoryStore {
  reservations: any[];
  stock: typeof STOCK_MOCK;
  processReturn: (
    reservationId: string,
    items: any[],
    hasDamage: boolean
  ) => void;

  updateStockStatus: (stockId: string, newStatus: StockStatus, damageNotes?: string) => void;

}


export const useInventoryStore = create<InventoryStore>((set) => ({
  reservations: [],
  stock: STOCK_MOCK,
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

  updateStockStatus: (stockId, newStatus, damageNotes?: string) =>
    set((state) => ({
      stock: state.stock.map((item) =>
        item.id.toString() === stockId.toString() ? {
           ...item, 
           status: newStatus, 
           damageNotes: damageNotes || item.damageNotes,
           updatedAt: new Date(),
          } : item
      ),
    })),
}));
