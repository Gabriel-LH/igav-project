import { create } from "zustand";
import { Product } from "@/src/types/product/type.product";
import { CartItem, CartOperationType } from "@/src/types/cart/type.cart";
import { differenceInDays } from "date-fns";
import { PROMOTIONS_MOCK } from "@/src/mocks/mock.promotions";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { applyPricingEngine } from "@/src/utils/pricing/applyPricingEngine";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { USER_MOCK } from "@/src/mocks/mock.user";
import {
  applyBundleToCart,
  BundleDefinition,
  clearBundleAssignments,
  createBundleDefinitionsFromPromotions,
  detectBundleEligibility,
} from "@/src/services/bundleService";

// --- HELPER DE CÁLCULO ---
const calculateSubtotal = (
  item: {
    product: Product;
    unitPrice: number;
    quantity: number;
  },
  dates: { from: Date; to: Date } | null,
  opType: CartOperationType,
) => {
  // 1. Si es Venta -> Precio final x Cantidad
  if (opType === "venta") return item.unitPrice * item.quantity;

  // 2. Si es Alquiler -> Precio final x Cantidad x Días
  const isEvent = item.product.rent_unit === "evento";

  const days = dates ? Math.max(differenceInDays(dates.to, dates.from), 1) : 1;

  const multiplier = isEvent ? 1 : days;

  return item.unitPrice * item.quantity * multiplier;
};

const getProductListPrice = (product: Product, type: CartOperationType) =>
  type === "venta" ? (product.price_sell ?? 0) : (product.price_rent ?? 0);

interface CartState {
  items: CartItem[];
  customerId: string | null;
  activeBundles: string[];

  // 📅 FECHAS GLOBALES
  globalRentalDates: { from: Date; to: Date } | null;
  globalRentalTimes: { pickup: string; return: string } | null;

  addItem: (
    product: Product,
    type: CartOperationType,
    stockId?: string,
    maxQuantity?: number,
    variant?: { size?: string; color?: string },
    customData?: {
      listPrice?: number;
      discountAmount?: number;
      discountReason?: string;
      bundleId?: string;
      appliedPromotionId?: string;
      priceAtMoment?: number;
    },
  ) => void;
  addBundleToCart: (promotionId: string) => void;
  applyBundleDefinition: (
    bundleDefinition: BundleDefinition,
    branchId: string,
    startDate: Date,
    endDate: Date,
  ) => ReturnType<typeof detectBundleEligibility>;
  clearBundleAssignments: () => void;
  reevaluateActiveBundle: (
    branchId: string,
    startDate: Date,
    endDate: Date,
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
  activeBundles: [],
  globalRentalDates: null, // Inicialmente null
  globalRentalTimes: null,

  addItem: (
    product,
    type,
    specificStockId,
    maxQuantity = 9999,
    variant,
    customData,
  ) => {
    set((state) => {
      const listPrice =
        customData?.listPrice ?? getProductListPrice(product, type);
      const isExplicitBundle = Boolean(
        customData?.bundleId && customData?.appliedPromotionId,
      );
      const pricing = isExplicitBundle
        ? applyPricingEngine({
            product,
            operationType: type,
            listPrice,
            promotions: [],
            businessRules: BUSINESS_RULES_MOCK,
            explicitBundle: {
              promotionId: customData!.appliedPromotionId!,
              bundleId: customData!.bundleId!,
              priceAtMoment: customData?.priceAtMoment ?? listPrice,
            },
            manualDiscountReason: customData?.discountReason,
          })
        : {
            listPrice,
            priceAtMoment: listPrice,
            discountAmount: 0,
            discountReason: undefined,
            promotionId: undefined,
            bundleId: undefined,
            requiresAdminAuth: false,
          };
      const finalUnitPrice = pricing.priceAtMoment;

      // 1. Buscar si ya existe el ítem (mismo producto + variante + tipo)
      const existingIndex = state.items.findIndex((i) => {
        const sameProduct = i.product.id === product.id;
        const sameType = i.operationType === type;
        const sameSize = i.selectedSizeId === variant?.size;
        const sameColor = i.selectedColorId === variant?.color;
        const sameBundle = (i.bundleId ?? null) === (pricing.bundleId ?? null);
        const samePromotion =
          (i.appliedPromotionId ?? null) === (pricing.promotionId ?? null);
        const sameUnitPrice = i.unitPrice === finalUnitPrice;

        return (
          sameProduct &&
          sameType &&
          sameSize &&
          sameColor &&
          sameBundle &&
          samePromotion &&
          sameUnitPrice
        );
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
        unitPrice: finalUnitPrice,
        listPrice: pricing.listPrice,
        discountAmount: pricing.discountAmount,
        discountReason: pricing.discountReason,
        bundleId: pricing.bundleId,
        appliedPromotionId: pricing.promotionId,
        subtotal: calculateSubtotal(
          {
            product,
            unitPrice: finalUnitPrice,
            quantity: 1,
          },
          state.globalRentalDates,
          type,
        ),
        selectedCodes: specificStockId ? [specificStockId] : [], // specificStockId should be the UIID (id)
        selectedSizeId: variant?.size,
        selectedColorId: variant?.color,
      };

      return { items: [...state.items, newItem] };
    });
  },

  addBundleToCart: (promotionId) => {
    const promotion = PROMOTIONS_MOCK.find((p) => p.id === promotionId);
    if (!promotion || promotion.type !== "bundle" || !promotion.bundleConfig) {
      return;
    }

    const cartOperationTypes = Array.from(
      new Set(get().items.map((i) => i.operationType)),
    );

    const operationType = cartOperationTypes.find((type) =>
      promotion.appliesTo.includes(type),
    );

    if (!operationType) return;
    const bundleId = crypto.randomUUID();
    const { products, inventoryItems, stockLots } =
      useInventoryStore.getState();
    const currentBranchId = USER_MOCK[0].branchId;
    const requiredProducts = promotion.bundleConfig.requiredProductIds
      .map((id) => products.find((product) => product.id === id))
      .filter((p): p is Product => Boolean(p));

    const listPrices = requiredProducts.map((product) =>
      getProductListPrice(product, operationType),
    );
    const totalList = listPrices.reduce((sum, value) => sum + value, 0);
    if (requiredProducts.length === 0 || totalList <= 0) return;

    const normalizedBundlePrice = Math.max(
      0,
      promotion.bundleConfig.bundlePrice,
    );

    requiredProducts.forEach((product, index) => {
      if (!promotion.appliesTo?.length) return;

      const operationType = promotion.appliesTo.find((type) =>
        get().items.some((item) => item.operationType === type),
      );

      if (!operationType) return;
      const source = product.is_serial ? inventoryItems : stockLots;
      const candidates = source.filter((item) => {
        const forOperation =
          operationType === "venta" ? item.isForSale : item.isForRent;
        return (
          item.productId === product.id &&
          item.branchId === currentBranchId &&
          item.status === "disponible" &&
          forOperation
        );
      });

      if (candidates.length === 0) return;

      const firstCandidate = candidates[0];
      const maxQuantity = product.is_serial
        ? candidates.length
        : (candidates as Array<{ quantity: number }>).reduce(
            (sum, lot) => sum + lot.quantity,
            0,
          );
      const itemList = listPrices[index];
      const factor = normalizedBundlePrice / totalList;
      const proratedPrice =
        promotion.bundleConfig?.prorateStrategy === "equal"
          ? normalizedBundlePrice / requiredProducts.length
          : itemList * factor;

      const discountAmount = Math.max(0, itemList - proratedPrice);

      get().addItem(
        product,
        operationType,
        product.is_serial ? firstCandidate.id : undefined,
        maxQuantity,
        {
          size: firstCandidate.sizeId,
          color: firstCandidate.colorId,
        },
        {
          listPrice: itemList,
          priceAtMoment: proratedPrice,
          discountAmount,
          discountReason: promotion.name,
          bundleId,
          appliedPromotionId: promotion.id,
        },
      );
    });
  },

  applyBundleDefinition: (bundleDefinition, branchId, startDate, endDate) => {
    const { cart, eligibility } = applyBundleToCart(
      get().items,
      bundleDefinition,
      branchId,
      startDate,
      endDate,
    );

    set((state) => {
      if (!eligibility.eligible) {
        return { items: cart };
      }

      const alreadyActive = state.activeBundles.includes(bundleDefinition.id);

      return {
        items: cart,
        activeBundles: alreadyActive
          ? state.activeBundles
          : [...state.activeBundles, bundleDefinition.id],
      };
    });

    return eligibility;
  },

  clearBundleAssignments: () => {
    const dates = get().globalRentalDates;
    if (!dates) {
      set((state) => ({
        activeBundles: [],
        items: state.items.map((item) => ({
          ...item,
          bundleId: undefined,
        })),
      }));
      return;
    }

    const cart = clearBundleAssignments(get().items, dates.from, dates.to);

    set({
      items: cart,
      activeBundles: [],
    });
  },

  reevaluateActiveBundle: (branchId, startDate, endDate) => {
    const activeBundles = get().activeBundles;
    if (!activeBundles.length) return;

    let updatedCart: CartItem[] = get().items.map((item) => {
      const { bundleId, ...rest } = item;
      return rest as CartItem;
    });

    const definitions = createBundleDefinitionsFromPromotions();

    activeBundles.forEach((bundleId) => {
      const bundleDefinition = definitions.find((b) => b.id === bundleId);

      if (!bundleDefinition) return;

      const { cart } = applyBundleToCart(
        updatedCart,
        bundleDefinition,
        branchId,
        startDate,
        endDate,
      );

      updatedCart = cart;
    });
    set({ items: updatedCart });
  },

  updateQuantity: (cartId, quantity) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.cartId !== cartId) return item;
        return {
          ...item,
          quantity,
          bundleId: undefined,
          // Recalcular subtotal al cambiar cantidad
          subtotal: calculateSubtotal(
            {
              product: item.product,
              unitPrice: item.unitPrice,
              quantity,
            },
            state.globalRentalDates,
            item.operationType,
          ),
        };
      }),
    }));

    const dates = get().globalRentalDates;
    const activeBundles = get().activeBundles;
    if (dates && activeBundles.length) {
      get().reevaluateActiveBundle(USER_MOCK[0].branchId, dates.from, dates.to);
    }
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
      // Cambio de fechas: limpiar agrupaciones y recalcular
      items: state.items.map((item) => ({
        ...item,
        bundleId: undefined,
        subtotal: calculateSubtotal(
          {
            product: item.product,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          },
          range,
          item.operationType,
        ),
      })),
    }));

    if (get().activeBundles.length) {
      get().reevaluateActiveBundle(USER_MOCK[0].branchId, range.from, range.to);
    }
  },

  setGlobalTimes: (times) => set({ globalRentalTimes: times }),
  setCustomer: (id) => set({ customerId: id }),
  removeItem: (id) => {
    set((s) => ({
      items: s.items
        .filter((i) => i.cartId !== id)
        .map((item) => ({ ...item, bundleId: undefined })),
    }));

    const dates = get().globalRentalDates;
    const active = get().activeBundles.length;
    if (dates && active) {
      get().reevaluateActiveBundle(USER_MOCK[0].branchId, dates.from, dates.to);
    }
  },
  clearCart: () =>
    set({
      items: [],
      customerId: null,
      activeBundles: [],
      globalRentalDates: null,
      globalRentalTimes: null,
    }),
  getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
}));
