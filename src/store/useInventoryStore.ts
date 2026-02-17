import { create } from "zustand";
import { PRODUCTS_MOCK } from "../mocks/mocks.product";
import { INVENTORY_ITEMS_MOCK } from "../mocks/mock.inventoryItem";
import { STOCK_LOTS_MOCK } from "../mocks/mock.stockLote";

export type StockStatus =
  | "reservado"
  | "disponible"
  | "en_mantenimiento"
  | "vendido_pendiente_entrega"
  | "alquilado"
  | "en_lavanderia"
  | "baja"
  | "agotado"
  | "vendido";

interface InventoryLog {
  timestamp: Date;
  stockId: string;
  fromBranch: string;
  toBranch: string;
  userId: string;
  reason: string;
}

interface InventoryStore {
  inventoryItems: typeof INVENTORY_ITEMS_MOCK;
  stockLots: typeof STOCK_LOTS_MOCK;
  products: typeof PRODUCTS_MOCK;
  inventoryLogs: InventoryLog[];

  // Para serializados
  updateInventoryItemStatus: (
    serialCode: string,
    newStatus: StockStatus,
    damageNotes?: string,
  ) => void;

  // Para no serializados
  decreaseStockLot: (variantCode: string, quantity: number) => void;

  deliverAndTransfer: (
    stockId: string,
    status: StockStatus,
    targetBranchId: string,
    adminId: string,
  ) => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  inventoryItems: INVENTORY_ITEMS_MOCK,
  stockLots: STOCK_LOTS_MOCK,
  products: PRODUCTS_MOCK,
  inventoryLogs: [],

  // Para serializados
  getAvailableInventoryItem: (
    productId: string,
    size?: string,
    color?: string,
    status: StockStatus = "disponible",
  ) => {
    return get().inventoryItems.find(
      (item) =>
        item.productId === productId &&
        (!size || item.size.trim() === size.trim()) &&
        (!color || item.color.trim() === color.trim()) &&
        item.status === status,
    );
  },

  // Para no serializados (lotes)
  getAvailableStockLot: (
    productId: string,
    size?: string,
    color?: string,
    status: StockStatus = "disponible",
  ) => {
    return get().stockLots.find(
      (lot) =>
        lot.productId === productId &&
        (!size || lot.size.trim() === size.trim()) &&
        (!color || lot.color.trim() === color.trim()) &&
        lot.status === status &&
        lot.quantity > 0,
    );
  },

  // 🔹 Actualizar estado de unidad serializada
  updateInventoryItemStatus: (serialCode, newStatus, damageNotes) =>
    set((state) => ({
      inventoryItems: state.inventoryItems.map((item) =>
        item.serialCode === serialCode
          ? {
              ...item,
              status: newStatus,
              damageNotes: damageNotes || item.damageNotes,
              updatedAt: new Date(),
            }
          : item,
      ),
    })),

  // 🔹 Descontar cantidad de lote (producto no serializado)
  decreaseStockLot: (variantCode, quantity) =>
    set((state) => ({
      stockLots: state.stockLots.map((lot) =>
        lot.variantCode === variantCode
          ? {
              ...lot,
              quantity: lot.quantity - quantity,
              updatedAt: new Date(),
            }
          : lot,
      ),
    })),

  // 🔹 Mantengo deliverAndTransfer, ahora para serializados
  deliverAndTransfer: (stockId, status, targetBranchId, adminId) =>
    set((state) => {
      // Busco primero en inventoryItems (serializados)
      const item =
        state.inventoryItems.find(
          (i) => i.serialCode === stockId || i.id === stockId,
        ) ||
        // Si no está, por compatibilidad temporal, busco en stockLots
        state.stockLots.find(
          (l) => l.variantCode === stockId || l.id === stockId,
        );

      if (!item) return state;

      const needsTransfer =
        "branchId" in item && item.branchId !== targetBranchId;
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
        inventoryItems: state.inventoryItems.map((i) =>
          i.serialCode === stockId || i.id === stockId
            ? {
                ...i,
                status: status,
                branchId: targetBranchId,
                updatedAt: new Date(),
              }
            : i,
        ),
        stockLots: state.stockLots.map((l) =>
          l.variantCode === stockId || l.id === stockId
            ? {
                ...l,
                status: status,
                branchId: targetBranchId,
                updatedAt: new Date(),
              }
            : l,
        ),
        inventoryLogs: newLogs,
      };
    }),
}));
