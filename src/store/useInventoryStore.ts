import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PRODUCTS_MOCK } from "../mocks/mocks.product";
import { INVENTORY_ITEMS_MOCK } from "../mocks/mock.inventoryItem";
import { STOCK_LOTS_MOCK } from "../mocks/mock.stockLote";
import { PRODUCT_VARIANTS_MOCK } from "../mocks/mock.productVariant";
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
  quantity?: number; // Agregamos cantidad para logs de lotes
}

interface InventoryStore {
  inventoryItems: typeof INVENTORY_ITEMS_MOCK;
  stockLots: typeof STOCK_LOTS_MOCK;
  products: typeof PRODUCTS_MOCK;
  productVariants: typeof PRODUCT_VARIANTS_MOCK;
  inventoryLogs: InventoryLog[];

  // 1. Acciones para SERIALIZADOS (Items únicos)
  // Cambia estado y ubicación de un item específico
  updateItemStatus: (
    itemId: string,
    newStatus: InventoryItemStatus,
    targetBranchId?: string,
    adminId?: string,
  ) => void;

  // 2. Acciones para LOTES (Cantidad)
  // Resta cantidad de un lote (Venta/Salida)
  decreaseLotQuantity: (lotId: string, quantity: number) => void;

  increaseLotQuantity: (lotId: string, quantity: number) => void;

  // Mueve cantidad de un lote a otro (Transferencia entre sucursales)
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
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      inventoryItems: INVENTORY_ITEMS_MOCK,
      stockLots: STOCK_LOTS_MOCK,
      products: PRODUCTS_MOCK,
      productVariants: PRODUCT_VARIANTS_MOCK,
      inventoryLogs: [],

      // Getter unificado para que la UI no se rompa (Simula una lista plana)
      get stock() {
        // Unimos items y lotes en una sola lista para el POS/Buscador
        const items = get().inventoryItems.map((i) => ({
          ...i,
          quantity: 1,
          type: "serial",
        }));
        const lots = get().stockLots.map((l) => ({ ...l, type: "lot" })); // Ya tiene quantity
        return [...items, ...lots];
      },

      // -----------------------------------------------------------
      // 1. LÓGICA PARA ITEMS SERIALIZADOS (Ropa, Activos)
      // -----------------------------------------------------------
      updateItemStatus: (itemId, newStatus, targetBranchId, adminId) => {
        set((state) => {
          const itemIndex = state.inventoryItems.findIndex(
            (i) => i.id === itemId,
          );
          if (itemIndex === -1) return state;

          const item = state.inventoryItems[itemIndex];
          const newLogs = [...state.inventoryLogs];
          let newBranchId = item.branchId;

          // Si hay cambio de sucursal, registramos log y actualizamos branchId
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

      // -----------------------------------------------------------
      // 2. LÓGICA PARA LOTES (Accesorios, Consumibles)
      // -----------------------------------------------------------
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
        // ESTO ES COMPLEJO: Implica restar de Lote A y sumar a Lote B (o crearlo)
        // Por ahora, simplificamos asumiendo que solo restamos del origen
        // (la lógica de "recibir" suele ser otro proceso)
        set((state) => {
          const sourceLot = state.stockLots.find((l) => l.id === sourceLotId);
          if (!sourceLot || sourceLot.quantity < quantity) return state;

          // 1. Restar del origen
          const updatedLots = state.stockLots.map((l) =>
            l.id === sourceLotId
              ? { ...l, quantity: l.quantity - quantity, updatedAt: new Date() }
              : l,
          );

          // 2. Buscar o Crear destino (Simulado)
          // En un backend real, harías un UPSERT en la tabla de lotes destino.
          // Aquí solo logueamos la salida.

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
    }),
    {
      name: "inventory-storage",
    },
  ),
);
