import { create } from "zustand";
import { Product } from "@/src/types/product/type.product";
import { CartItem, CartOperationType } from "@/src/types/cart/type.cart";

interface CartState {
  items: CartItem[];
  customerId: string | null;

  // 📅 FECHAS GLOBALES (Para alquileres)
  globalRentalDates: { from: Date; to: Date } | null;

  addItem: (
    product: Product,
    type: CartOperationType,
    stockId?: string,
    maxQuantity?: number,
    variant?: { size?: string; color?: string }, // 👈 Nuevo parámetro opcional
  ) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;

  // Asignar IDs masivos (cuando agrupamos seriales)
  updateSelectedStock: (cartId: string, stockIds: string[]) => void;

  setGlobalDates: (range: { from: Date; to: Date }) => void;
  setCustomer: (id: string | null) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  globalRentalDates: null, // Por defecto null (o hoy/mañana)

  addItem: (product, type, specificStockId, maxQuantity = 9999, variant) => {
    // Valor por defecto alto si no se pasa
    set((state) => {
      const unitPrice =
        type === "venta"
          ? (product.price_sell ?? 0)
          : (product.price_rent ?? 0);

      // 1. BUSCAR SI YA EXISTE
      const existingIndex = state.items.findIndex((i) => {
        const sameProduct = i.product.id === product.id;
        const sameType = i.operationType === type;
        // Si el producto no tiene variantes, variant es undefined, así que comparamos eso también
        const sameSize = i.selectedSize === variant?.size;
        const sameColor = i.selectedColor === variant?.color;

        return sameProduct && sameType && sameSize && sameColor;
      });

      if (existingIndex !== -1) {
        const updatedItems = [...state.items];
        const item = updatedItems[existingIndex];

        // --- VALIDACIÓN DE STOCK ---
        if (item.quantity >= maxQuantity) {
          // Opcional: Podrías retornar el state sin cambios o lanzar un error/toast desde el componente
          console.warn("Stock máximo alcanzado en carrito");
          return state;
        }
        // ---------------------------

        const newStockIds = specificStockId
          ? [...item.selectedStockIds, specificStockId]
          : item.selectedStockIds;

        const newQuantity = product.is_serial
          ? specificStockId
            ? newStockIds.length
            : item.quantity + 1
          : item.quantity + 1;

        updatedItems[existingIndex] = {
          ...item,
          quantity: newQuantity,
          selectedStockIds: newStockIds,
          subtotal: newQuantity * item.unitPrice,
        };
        return { items: updatedItems };
      }

      // 2. SI NO EXISTE
      // --- VALIDACIÓN INICIAL ---
      if (maxQuantity < 1) return state; // No hay stock para empezar
      // --------------------------

      const newItem: CartItem = {
        cartId: crypto.randomUUID(),
        product,
        operationType: type,
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
        selectedStockIds: specificStockId ? [specificStockId] : [],
        // Guardamos la variante seleccionada
        selectedSize: variant?.size,
        selectedColor: variant?.color,
      };
      return { items: [...state.items, newItem] };
    });
  },

  // ... (removeItem y clearCart igual que antes)

  updateQuantity: (cartId, quantity) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.cartId !== cartId) return item;
        // Si es serial, NO dejamos cambiar cantidad manualmente (se debe escanear o asignar)
        // A menos que quieras permitir poner "3" y luego asignar los 3 IDs.
        // Permitamos cambiar cantidad, pero el usuario tendrá un warning visual si faltan IDs.
        return {
          ...item,
          quantity,
          subtotal: quantity * item.unitPrice,
        };
      }),
    }));
  },

  updateSelectedStock: (cartId, stockIds) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.cartId !== cartId) return item;
        return {
          ...item,
          selectedStockIds: stockIds,
        };
      }),
    }));
  },

  setGlobalDates: (range) => set({ globalRentalDates: range }),
  setCustomer: (id) => set({ customerId: id }),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.cartId !== id) })),
  clearCart: () =>
    set({ items: [], customerId: null, globalRentalDates: null }),
  getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
}));
