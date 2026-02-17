import { create } from "zustand";
import { Product } from "@/src/types/product/type.product";
import { CartItem, CartOperationType } from "@/src/types/cart/type.cart";
import { differenceInDays } from "date-fns";

// --- HELPER DE CÁLCULO ---
const calculateSubtotal = (
  item: { product: Product; unitPrice: number; quantity: number },
  dates: { from: Date; to: Date } | null,
  opType: CartOperationType,
) => {
  // 1. Si es Venta -> Precio x Cantidad (Simple)
  if (opType === "venta") return item.unitPrice * item.quantity;

  // 2. Si es Alquiler -> Precio x Cantidad x Días
  const isEvent = item.product.rent_unit === "evento";

  // Si no hay fechas definidas, asumimos 1 día por defecto para no mostrar 0
  const days = dates
    ? Math.max(differenceInDays(dates.to, dates.from), 1) // Ojo: differenceInDays puede ser 0 si es el mismo día, forzamos min 1
    : 1;

  const multiplier = isEvent ? 1 : days;

  return item.unitPrice * item.quantity * multiplier;
};

interface CartState {
  items: CartItem[];
  customerId: string | null;

  // 📅 FECHAS GLOBALES
  globalRentalDates: { from: Date; to: Date } | null;
  globalRentalTimes: { pickup: string; return: string } | null;

  addItem: (
    product: Product,
    type: CartOperationType,
    stockId?: string,
    maxQuantity?: number,
    variant?: { size?: string; color?: string },
  ) => void;

  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateSelectedStock: (cartId: string, stockIds: string[]) => void;

  setGlobalDates: (range: { from: Date; to: Date }) => void;
  setGlobalTimes: (times: { pickup: string; return: string }) => void;
  setCustomer: (id: string | null) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  globalRentalDates: null, // Inicialmente null
  globalRentalTimes: null,

  addItem: (product, type, specificStockId, maxQuantity = 9999, variant) => {
    set((state) => {
      const unitPrice =
        type === "venta"
          ? (product.price_sell ?? 0)
          : (product.price_rent ?? 0);

      // 1. Buscar si ya existe el ítem (mismo producto + variante + tipo)
      const existingIndex = state.items.findIndex((i) => {
        const sameProduct = i.product.id === product.id;
        const sameType = i.operationType === type;
        const sameSize = i.selectedSize === variant?.size;
        const sameColor = i.selectedColor === variant?.color;

        return sameProduct && sameType && sameSize && sameColor;
      });

      // A. SI YA EXISTE -> ACTUALIZAR
      if (existingIndex !== -1) {
        const updatedItems = [...state.items];
        const item = updatedItems[existingIndex];

        if (item.quantity >= maxQuantity) {
          // Opcional: toast.warning("Stock máximo alcanzado")
          return state;
        }

        const newCodes = specificStockId
          ? [...item.selectedCodes, specificStockId] // Agregar nuevo serial/lote
          : item.selectedCodes; // Mantener los que había

        const newQuantity = product.is_serial
          ? specificStockId
            ? newCodes.length // Si es serial y pasamos ID, la cantidad es la longitud del array
            : item.quantity + 1 // Si es serial pero manual, solo sumamos 1
          : item.quantity + 1; // Si es lote, sumamos 1

        updatedItems[existingIndex] = {
          ...item,
          quantity: newQuantity,
          selectedCodes: newCodes,
          subtotal: calculateSubtotal(
            {
              product: item.product,
              unitPrice: item.unitPrice,
              quantity: newQuantity,
            },
            state.globalRentalDates,
            type,
          ),
        };
        return { items: updatedItems };
      }

      // B. SI NO EXISTE -> CREAR NUEVO
      if (maxQuantity < 1) return state; // Validación de seguridad

      const newItem: CartItem = {
        cartId: crypto.randomUUID(),
        product,
        operationType: type,
        quantity: 1,
        unitPrice,
        subtotal: calculateSubtotal(
          { product, unitPrice, quantity: 1 },
          state.globalRentalDates,
          type,
        ),
        selectedCodes: specificStockId ? [specificStockId] : [],
        selectedSize: variant?.size,
        selectedColor: variant?.color,
      };

      return { items: [...state.items, newItem] };
    });
  },

  updateQuantity: (cartId, quantity) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.cartId !== cartId) return item;
        return {
          ...item,
          quantity,
          // Recalcular subtotal al cambiar cantidad
          subtotal: calculateSubtotal(
            { product: item.product, unitPrice: item.unitPrice, quantity },
            state.globalRentalDates,
            item.operationType,
          ),
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
          selectedCodes: stockIds,
          // NOTA: No cambiamos quantity aquí para evitar el bug de reset a 0
        };
      }),
    }));
  },

  setGlobalDates: (range) => {
    set((state) => ({
      globalRentalDates: range,
      // 🔥 MAGIA: Recalcular TODOS los subtotales de items de alquiler
      items: state.items.map((item) => ({
        ...item,
        subtotal: calculateSubtotal(
          {
            product: item.product,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          },
          range, // Usamos las NUEVAS fechas
          item.operationType,
        ),
      })),
    }));
  },

  setGlobalTimes: (times) => set({ globalRentalTimes: times }),
  setCustomer: (id) => set({ customerId: id }),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.cartId !== id) })),
  clearCart: () =>
    set({
      items: [],
      customerId: null,
      globalRentalDates: null,
      globalRentalTimes: null,
    }),
  getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
}));
