// src/store/useInventoryStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InventoryItemStatus } from "../utils/status-type/InventoryItemStatusType";
import { Product } from "../types/product/type.product";
import { ProductVariant } from "../types/product/type.productVariant";
import { StockLot } from "../types/product/type.stockLote";
import { InventoryItem } from "../types/product/type.inventoryItem";

interface InventoryLog {
  timestamp: Date;
  stockId: string;
  fromBranch: string;
  toBranch: string;
  userId: string;
  reason: string;
  quantity?: number;
}

interface InventoryStore {
  inventoryItems: InventoryItem[];
  stockLots: StockLot[];
  products: Product[];
  productVariants: ProductVariant[];
  inventoryLogs: InventoryLog[];

  // 1. Acciones para SERIALIZADOS (Items únicos)
  updateItemStatus: (
    itemId: string,
    newStatus: InventoryItemStatus,
    targetBranchId?: string,
    adminId?: string,
  ) => void;

  // 2. Acciones para LOTES (Cantidad)
  decreaseLotQuantity: (lotId: string, quantity: number) => void;
  increaseLotQuantity: (lotId: string, quantity: number) => void;
  transferLotQuantity: (
    sourceLotId: string,
    targetBranchId: string,
    quantity: number,
    adminId: string,
  ) => void;

  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  softDeleteProduct: (productId: string, deletedBy?: string) => void;
  addProductVariants: (variants: ProductVariant[]) => void;
  updateProductVariant: (
    variantId: string,
    updates: Partial<ProductVariant>,
  ) => void;
  removeProductVariant: (variantId: string) => void;
  addStockLot: (stockLot: StockLot) => void;
  removeStockLot: (stockLotId: string) => void;
  addInventoryItems: (items: InventoryItem[]) => void;
  removeInventoryItem: (itemId: string) => void;

  // 3. Acciones de Sincronización (DB -> Store)
  setProducts: (products: Product[]) => void;
  setProductVariants: (variants: ProductVariant[]) => void;
  setInventoryItems: (items: InventoryItem[]) => void;
  setStockLots: (lots: StockLot[]) => void;
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      inventoryItems: [],
      stockLots: [],
      products: [],
      productVariants: [],
      inventoryLogs: [],

      // Getter unificado para que la UI no se rompa
      get stock() {
        const items = get().inventoryItems.map((i) => ({
          ...i,
          quantity: 1,
          type: "serial",
        }));
        const lots = get().stockLots.map((l) => ({ ...l, type: "lot" }));
        return [...items, ...lots];
      },

      updateItemStatus: (itemId, newStatus, targetBranchId, adminId) => {
        set((state) => {
          const itemIndex = state.inventoryItems.findIndex(
            (i) => i.id === itemId,
          );
          if (itemIndex === -1) return state;

          const item = state.inventoryItems[itemIndex];
          const newLogs = [...state.inventoryLogs];
          let newBranchId = item.branchId;

          if (targetBranchId && targetBranchId !== item.branchId) {
            newBranchId = targetBranchId;
            if (adminId) {
              newLogs.push({
                timestamp: new Date(),
                stockId: itemId,
                fromBranch: item.branchId,
                toBranch: targetBranchId,
                userId: adminId,
                reason: `Cambio de estado a ${newStatus}`,
                quantity: 1,
              });
            }
          }

          const updatedItems = [...state.inventoryItems];
          updatedItems[itemIndex] = {
            ...item,
            status: newStatus,
            branchId: newBranchId,
            updatedAt: new Date(),
          };

          return { inventoryItems: updatedItems, inventoryLogs: newLogs };
        });
      },

      decreaseLotQuantity: (lotId, quantity) => {
        set((state) => ({
          stockLots: state.stockLots.map((lot) => {
            if (lot.id === lotId) {
              const newQty = Math.max(0, lot.quantity - quantity);
              return { ...lot, quantity: newQty, updatedAt: new Date() };
            }
            return lot;
          }),
        }));
      },

      increaseLotQuantity: (lotId, quantity) => {
        set((state) => ({
          stockLots: state.stockLots.map((lot) => {
            if (lot.id === lotId) {
              return {
                ...lot,
                quantity: lot.quantity + quantity,
                updatedAt: new Date(),
              };
            }
            return lot;
          }),
        }));
      },

      transferLotQuantity: (sourceLotId, targetBranchId, quantity, adminId) => {
        set((state) => {
          const sourceLot = state.stockLots.find((l) => l.id === sourceLotId);
          if (!sourceLot || sourceLot.quantity < quantity) return state;

          const updatedLots = state.stockLots.map((l) =>
            l.id === sourceLotId
              ? { ...l, quantity: l.quantity - quantity, updatedAt: new Date() }
              : l,
          );

          const newLogs = [
            ...state.inventoryLogs,
            {
              timestamp: new Date(),
              stockId: sourceLotId,
              fromBranch: sourceLot.branchId,
              toBranch: targetBranchId,
              userId: adminId,
              reason: "Transferencia de Lote",
              quantity: quantity,
            },
          ];

          return { stockLots: updatedLots, inventoryLogs: newLogs };
        });
      },

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      updateProduct: (productId, updates) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === productId ? { ...product, ...updates } : product,
          ),
        })),

      softDeleteProduct: (productId, deletedBy) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === productId
              ? {
                  ...product,
                  isDeleted: true,
                  deletedAt: new Date(),
                  deletedBy: deletedBy ?? "system",
                  deleteReason: "Eliminado desde inventario",
                  updatedAt: new Date(),
                }
              : product,
          ),
        })),

      addProductVariants: (variants) =>
        set((state) => ({
          productVariants: [...state.productVariants, ...variants],
        })),

      updateProductVariant: (variantId, updates) =>
        set((state) => ({
          productVariants: state.productVariants.map((variant) =>
            variant.id === variantId ? { ...variant, ...updates } : variant,
          ),
        })),

      removeProductVariant: (variantId) =>
        set((state) => ({
          productVariants: state.productVariants.filter(
            (variant) => variant.id !== variantId,
          ),
        })),

      addStockLot: (stockLot) =>
        set((state) => ({
          stockLots: [...state.stockLots, stockLot],
        })),

      removeStockLot: (stockLotId) =>
        set((state) => ({
          stockLots: state.stockLots.filter(
            (stockLot) => stockLot.id !== stockLotId,
          ),
        })),

      addInventoryItems: (items) =>
        set((state) => ({
          inventoryItems: [...state.inventoryItems, ...items],
        })),

      removeInventoryItem: (itemId) =>
        set((state) => ({
          inventoryItems: state.inventoryItems.filter(
            (item) => item.id !== itemId,
          ),
        })),

      setProducts: (products) => set({ products }),
      setProductVariants: (productVariants) => set({ productVariants }),
      setInventoryItems: (inventoryItems) => set({ inventoryItems }),
      setStockLots: (stockLots) => set({ stockLots }),
    }),
    {
      name: "inventory-storage",
    },
  ),
);
