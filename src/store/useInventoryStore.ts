import { create } from "zustand";
import { STOCK_MOCK } from "../mocks/mock.stock";

type StockStatus = "disponible" | "mantenimiento" | "alquilado" | "lavanderia" | "baja" | "agotado" | "vendido";

interface InventoryLog {
  timestamp: Date;
  stockId: string;
  fromBranch: string;
  toBranch: string;
  userId: string;
  reason: string;
}

interface InventoryStore {
  stock: typeof STOCK_MOCK;
  inventoryLogs: InventoryLog[]; // Importante para la trazabilidad
  updateStockStatus: (stockId: string, newStatus: StockStatus, damageNotes?: string) => void;
  // Esta es la función profesional de "Mudanza + Alquiler"
  deliverAndTransfer: (stockId: string, targetBranchId: string, adminId: string) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  stock: STOCK_MOCK,
  inventoryLogs: [],

  updateStockStatus: (stockId, newStatus, damageNotes) =>
    set((state) => ({
      stock: state.stock.map((item) =>
        item.id.toString() === stockId.toString()
          ? {
              ...item,
              status: newStatus,
              damageNotes: damageNotes || item.damageNotes,
              updatedAt: new Date(),
            }
          : item
      ),
    })),

  deliverAndTransfer: (stockId, targetBranchId, adminId) =>
    set((state) => {
      const item = state.stock.find((s) => s.id.toString() === stockId.toString());
      if (!item) return state;

      const needsTransfer = item.branchId !== targetBranchId;
      const newLogs = [...state.inventoryLogs];

      if (needsTransfer) {
        newLogs.push({
          timestamp: new Date(),
          stockId,
          fromBranch: item.branchId,
          toBranch: targetBranchId,
          userId: adminId,
          reason: "Transferencia automática por entrega de reserva",
        });
      }

      return {
        stock: state.stock.map((s) =>
          s.id.toString() === stockId.toString()
            ? { ...s, status: "alquilado", branchId: targetBranchId, updatedAt: new Date() }
            : s
        ),
        inventoryLogs: newLogs,
      };
    }),
}));