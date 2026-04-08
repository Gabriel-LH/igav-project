import { create } from "zustand";
import { persist } from "zustand/middleware";
import { differenceInDays } from "date-fns";
import { Product } from "@/src/types/product/type.product";
import { CartItem, CartOperationType } from "@/src/types/cart/type.cart";
import { applyPricingEngine } from "@/src/utils/pricing/applyPricingEngine";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";
import { useBranchStore, GLOBAL_BRANCH_ID } from "./useBranchStore";
import {
  BundleDomainService,
  BundleDefinition,
} from "@/src/domain/tenant/services/bundle.service";
import { PromotionService } from "../domain/tenant/services/promotion.service";
import { resolveCouponPromotion } from "../utils/promotion/resolveCuponPromotion";
import { usePromotionStore } from "./usePromotionStore";
import { Promotion } from "../types/promotion/type.promotion";
import { calculateCartAction } from "@/src/app/(tenant)/tenant/actions/promotion.actions";
import { toast } from "sonner";

const bundleService = new BundleDomainService();
const promotionService = new PromotionService();

// --- HELPER DE CÁLCULO ---
const calculateSubtotal = (
  item: {
    product: Product;
    variantId?: string;
    unitPrice: number;
    quantity: number;
  },
  dates: { from: Date; to: Date } | null,
  opType: CartOperationType,
) => {
  // 1. Si es Venta -> Precio final x Cantidad
  if (opType === "venta") return item.unitPrice * item.quantity;

  // 2. Si es Alquiler -> Precio final x Cantidad x Días
  const variant = useInventoryStore
    .getState()
    .productVariants.find((v) => v.id === item.variantId);
  const isEvent = variant?.rentUnit === "evento";

  const days = dates ? Math.max(differenceInDays(dates.to, dates.from), 1) : 1;

  const multiplier = isEvent ? 1 : days;
  const rawSubtotal = item.unitPrice * item.quantity * multiplier;
  return Math.round(rawSubtotal * 100) / 100;
};

const getProductListPrice = (
  variantId: string | undefined,
  type: CartOperationType,
) => {
  const variant = useInventoryStore.getState().productVariants.find((v) => v.id === variantId);
  if (!variant) return 0;
  return type === "venta" ? (variant.priceSell ?? 0) : (variant.priceRent ?? 0);
};

interface CartState {
  items: CartItem[];
  customerId: string | null;
  activeBundles: string[];
  activeTenantId: string | null;

  // 📅 FECHAS GLOBALES
  globalRentalDates: { from: Date; to: Date } | null;
  globalRentalTimes: { pickup: string; return: string } | null;

  appliedCouponCode: string | null;
  manualPromotionId: string | null; // promo activada manualmente
  referralRewardAmount: number; // saldo tipo reward

  setCouponCode: (code: string | null) => void;
  setReferralReward: (amount: number) => void;

  addItem: (
    product: Product,
    type: CartOperationType,
    stockId?: string,
    maxQuantity?: number,
    variantId?: string,
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
  ) => ReturnType<typeof bundleService.detectBundleEligibility>;
  clearBundleAssignments: () => void;
  reevaluateActiveBundle: (
    branchId: string,
    startDate: Date,
    endDate: Date,
  ) => void;
  syncCartWithServer: () => Promise<void>;
  applyPromotions: (branchId: string) => void;

  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateManualDiscount: (
    cartId: string,
    amount: number,
    reason?: string,
  ) => void;
  updateSelectedStock: (cartId: string, stockIds: string[]) => void;

  setGlobalDates: (range: { from: Date; to: Date }) => void;
  setGlobalTimes: (times: { pickup: string; return: string }) => void;
  setCustomer: (id: string | null) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      activeBundles: [],
      activeTenantId: null,
      globalRentalDates: null, // Inicialmente null
      globalRentalTimes: null,
      appliedCouponCode: null,
      manualPromotionId: null,
      referralRewardAmount: 0,

      setCouponCode: (code) => {
        set({ appliedCouponCode: code });
        const bid = useBranchStore.getState().selectedBranchId;
        if (bid && bid !== GLOBAL_BRANCH_ID) get().applyPromotions(bid);
      },

      setReferralReward: (amount) => {
        set({ referralRewardAmount: amount });
        const bid = useBranchStore.getState().selectedBranchId;
        if (bid && bid !== GLOBAL_BRANCH_ID) get().applyPromotions(bid);
      },

      syncCartWithServer: async () => {
        const { items, globalRentalDates } = get();
        const branchId = useBranchStore.getState().selectedBranchId || GLOBAL_BRANCH_ID;
        
        if (items.length === 0) return;

        const res = await calculateCartAction(
          items,
          branchId,
          globalRentalDates ? { from: globalRentalDates.from, to: globalRentalDates.to } : undefined
        );

        if (res.success && res.data) {
          const itemsFromData = (res.data as any).items as CartItem[];
          
          // Check if a bundle was applied that wasn't before
          const hadBundles = items.some(i => !!i.bundleId);
          const hasBundles = itemsFromData.some(i => !!i.bundleId);
          
          if (!hadBundles && hasBundles) {
            toast.success("¡Combo detectado!", {
              description: "Se han aplicado descuentos automáticos por combo."
            });
          }

          const currentItems = items;
          const nextItems = itemsFromData.map((nextItem) => {
            const previousItem =
              currentItems.find((item) => item.cartId === nextItem.cartId) ??
              currentItems.find((item) =>
                item.product.id === nextItem.product.id &&
                item.operationType === nextItem.operationType &&
                item.variantId === nextItem.variantId &&
                item.unitPrice === nextItem.unitPrice &&
                (item.appliedPromotionId ?? "") ===
                  (nextItem.appliedPromotionId ?? "") &&
                (item.bundleId ?? "") === (nextItem.bundleId ?? ""),
              );

            return {
              ...nextItem,
              requiresAdminAuth: previousItem?.requiresAdminAuth ?? false,
            };
          });

          set({ items: nextItems });
        }
      },

      addItem: (
        product,
        type,
        specificStockId,
        maxQuantity = 9999,
        variantId,
        customData,
      ) => {
        set((state) => {
          const incomingTenantId = product.tenantId;
          if (
            state.activeTenantId &&
            state.activeTenantId !== incomingTenantId
          ) {
            return state;
          }

          const listPrice =
            customData?.listPrice ?? getProductListPrice(variantId, type);
          const isExplicitBundle = Boolean(
            customData?.bundleId && customData?.appliedPromotionId,
          );
          const pricing = isExplicitBundle
            ? applyPricingEngine({
                product,
                operationType: type,
                listPrice,
                promotions: [],
                config: useTenantConfigStore.getState().config!,
                policy: useTenantConfigStore.getState().policy,
                manualDiscountAmount: customData?.manualDiscountAmount,
                manualDiscountReason: customData?.manualDiscountReason,
                explicitBundle: {
                  promotionId: customData!.appliedPromotionId!,
                  bundleId: customData!.bundleId!,
                  priceAtMoment: customData?.priceAtMoment ?? listPrice,
                },
              })
            : applyPricingEngine({
                product,
                operationType: type,
                listPrice,
                promotions: usePromotionStore.getState().promotions,
                config: useTenantConfigStore.getState().config!,
                policy: useTenantConfigStore.getState().policy,
                manualDiscountAmount: customData?.manualDiscountAmount,
                manualDiscountReason: customData?.manualDiscountReason,
              });
          const finalUnitPrice = pricing.priceAtMoment;

          // 1. Buscar si ya existe el ítem (mismo producto + variante + tipo)
          const existingIndex = state.items.findIndex((i) => {
            const sameProduct = i.product.id === product.id;
            const sameType = i.operationType === type;
            const sameVariant = i.variantId === variantId;
            const sameBundle =
              (i.bundleId ?? null) === (pricing.bundleId ?? null);
            const samePromotion =
              (i.appliedPromotionId ?? null) === (pricing.promotionId ?? null);
            const sameUnitPrice = i.unitPrice === finalUnitPrice;

            return (
              sameProduct &&
              sameType &&
              sameVariant &&
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
              requiresAdminAuth:
                item.requiresAdminAuth || pricing.requiresAdminAuth,
              selectedCodes: newCodes,
              subtotal: calculateSubtotal(
                {
                  product: item.product,
                  unitPrice: item.unitPrice,
                  quantity: newQuantity,
                  variantId: item.variantId,
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
            requiresAdminAuth: pricing.requiresAdminAuth,
            subtotal: calculateSubtotal(
              {
                product,
                unitPrice: finalUnitPrice,
                quantity: 1,
                variantId: variantId,
              },
              state.globalRentalDates,
              type,
            ),
            selectedCodes: specificStockId ? [specificStockId] : [],
            variantId: variantId,
            manualDiscountAmount: customData?.manualDiscountAmount,
            manualDiscountReason: customData?.manualDiscountReason,
          };

          return {
            items: [...state.items, newItem],
            activeTenantId: state.activeTenantId ?? incomingTenantId,
          };
        });
        
        const bid = useBranchStore.getState().selectedBranchId;
        if (bid && bid !== GLOBAL_BRANCH_ID) get().applyPromotions(bid);
        get().syncCartWithServer();
      },

      addBundleToCart: (promotionId) => {
        const promotions = usePromotionStore.getState().promotions;
        const promotion = promotions.find((p) => p.id === promotionId);
        if (
          !promotion ||
          promotion.type !== "bundle" ||
          !promotion.bundleConfig
        ) {
          return;
        }
        const tenantId =
          get().activeTenantId ?? get().items[0]?.product?.tenantId ?? null;
        if (!tenantId) return;

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
        const currentBranchId = useBranchStore.getState().selectedBranchId;
        const requiredProducts = promotion.bundleConfig.requiredProductIds
          .map((id) => products.find((product) => product.id === id))
          .filter((p): p is Product => Boolean(p && p.tenantId === tenantId));

        const listPrices = requiredProducts.map(
          (product) =>
            getProductListPrice(
              product.is_serial ? undefined : undefined,
              operationType,
            ), // We need variantId here, fix below
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
            firstCandidate.variantId,
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

      applyBundleDefinition: (
        bundleDefinition,
        branchId,
        startDate,
        endDate,
      ) => {
        const tenantId =
          get().activeTenantId ?? get().items[0]?.product?.tenantId ?? null;
        if (!tenantId) {
          return {
            eligible: false,
            possibleCount: 0,
            missingProducts: [],
            availabilityIssues: [
              {
                productId: "tenant_scope",
                required: 0,
                available: 0,
                reason: "No se pudo resolver tenant activo",
              },
            ],
          };
        }

        const config = useTenantConfigStore.getState().config!;
        const policy = useTenantConfigStore.getState().policy;

        const { cart, eligibility } = bundleService.applyBundleToCart(
          get().items,
          bundleDefinition,
          tenantId,
          branchId,
          startDate ?? new Date(),
          endDate ?? new Date(),
          usePromotionStore.getState().promotions,
          config,
          policy,
          useInventoryStore.getState().inventoryItems,
          useInventoryStore.getState().stockLots,
          useInventoryStore.getState().productVariants,
        );

        set((state) => {
          if (!eligibility.eligible) {
            return { items: cart };
          }

          const alreadyActive = state.activeBundles.includes(
            bundleDefinition.id,
          );

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

        const config = useTenantConfigStore.getState().config!;
        const policy = useTenantConfigStore.getState().policy;
        const variants = useInventoryStore.getState().productVariants;

        const updatedItems = bundleService.clearBundleAssignments(
          get().items,
          get().globalRentalDates?.from ?? new Date(),
          get().globalRentalDates?.to ?? new Date(),
          config,
          policy,
          variants,
        );

        set({
          items: updatedItems,
          activeBundles: [],
        });
      },

      reevaluateActiveBundle: (branchId, startDate, endDate) => {
        const activeBundles = get().activeBundles;
        if (!activeBundles.length) return;
        const tenantId =
          get().activeTenantId ?? get().items[0]?.product?.tenantId ?? null;
        if (!tenantId) return;

        let updatedCart: CartItem[] = get().items.map((item) => {
          const { bundleId, ...rest } = item;
          return rest as CartItem;
        });

        const products = useInventoryStore.getState().products;
        const definitions = bundleService.createBundleDefinitionsFromPromotions(
          usePromotionStore.getState().promotions,
          products,
          tenantId,
        );

        activeBundles.forEach((bundleId) => {
          const bundleDefinition = definitions.find(
            (b: BundleDefinition) => b.id === bundleId,
          );

          if (!bundleDefinition) return;

          const { cart } = bundleService.applyBundleToCart(
            updatedCart,
            bundleDefinition,
            tenantId,
            branchId,
            startDate,
            endDate,
            usePromotionStore.getState().promotions,
            useTenantConfigStore.getState().config!,
            useTenantConfigStore.getState().policy,
            useInventoryStore.getState().inventoryItems,
            useInventoryStore.getState().stockLots,
            useInventoryStore.getState().productVariants,
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
                  variantId: item.variantId,
                },
                state.globalRentalDates,
                item.operationType,
              ),
            };
          }),
        }));

        const dates = get().globalRentalDates;
        const bid = useBranchStore.getState().selectedBranchId;
        if (bid && bid !== GLOBAL_BRANCH_ID) {
           get().applyPromotions(bid);
           if (dates && get().activeBundles.length) {
             get().reevaluateActiveBundle(bid, dates.from, dates.to);
           }
        }
        get().syncCartWithServer();
      },
      updateManualDiscount: (cartId, amount, reason) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.cartId !== cartId) return item;

            const config = useTenantConfigStore.getState().config!;
            const policy = useTenantConfigStore.getState().policy;
            const promotions = usePromotionStore.getState().promotions;

            const pricing = applyPricingEngine({
              product: item.product,
              operationType: item.operationType,
              listPrice: item.listPrice || item.unitPrice,
              promotions,
              config,
              policy,
              manualDiscountAmount: amount,
              manualDiscountReason: reason,
              explicitBundle: item.bundleId ? {
                promotionId: item.appliedPromotionId!,
                bundleId: item.bundleId,
                priceAtMoment: item.unitPrice
              } : undefined
            });

            return {
              ...item,
              unitPrice: pricing.priceAtMoment,
              discountAmount: pricing.discountAmount,
              discountReason: pricing.discountReason,
              appliedPromotionId: pricing.promotionId,
              manualDiscountAmount: amount,
              manualDiscountReason: reason,
              requiresAdminAuth: pricing.requiresAdminAuth,
              subtotal: calculateSubtotal(
                {
                  product: item.product,
                  unitPrice: pricing.priceAtMoment,
                  quantity: item.quantity,
                  variantId: item.variantId,
                },
                state.globalRentalDates,
                item.operationType,
              ),
            };
          }),
        }));
        get().syncCartWithServer();
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

        const bid = useBranchStore.getState().selectedBranchId;
        if (bid && bid !== GLOBAL_BRANCH_ID) {
          get().applyPromotions(bid);
          if (get().activeBundles.length) {
            get().reevaluateActiveBundle(bid, range.from, range.to);
          }
        }
      },

      setGlobalTimes: (times) => set({ globalRentalTimes: times }),
      setCustomer: (id) => set({ customerId: id }),
      removeItem: (id) => {
        set((s) => {
          const nextItems = s.items
            .filter((i) => i.cartId !== id)
            .map((item) => ({ ...item, bundleId: undefined }));
          return {
            items: nextItems,
            activeTenantId: nextItems[0]?.product.tenantId ?? null,
          };
        });

        const bid = useBranchStore.getState().selectedBranchId;
        if (bid && bid !== GLOBAL_BRANCH_ID) {
            get().applyPromotions(bid);
            const dates = get().globalRentalDates;
            if (dates && get().activeBundles.length) {
                get().reevaluateActiveBundle(bid, dates.from, dates.to);
            }
        }
        get().syncCartWithServer();
      },
      clearCart: () =>
        set({
          items: [],
          customerId: null,
          activeBundles: [],
          activeTenantId: null,
          globalRentalDates: null,
          globalRentalTimes: null,
        }),
      getTotal: () => get().items.reduce((acc, item) => acc + item.subtotal, 0),
      applyPromotions: (branchId: string) => {
        const state = get();
        const rentalDates = state.globalRentalDates;
        const now = new Date();

        const tenantId =
          state.activeTenantId ?? state.items[0]?.product?.tenantId ?? null;
        const allPromotions = usePromotionStore.getState().promotions;
        let promotions = promotionService.getActivePromotions(
          tenantId ?? undefined,
          ["automatic"],
          allPromotions,
        );

        // 🔹 1. Resolver cupón manual
        if (state.appliedCouponCode) {
          const couponPromo = resolveCouponPromotion(
            state.appliedCouponCode,
            promotions,
            now,
          );

          if (couponPromo) {
            promotions = [...promotions, couponPromo];
          }
        }

        // 🔹 2. Convertir referral reward en promoción temporal
        if (state.referralRewardAmount > 0) {
          promotions = [
            ...promotions,
            {
              id: "referral-reward",
              name: "Reward por referido",
              type: "fixed_amount",
              scope: "global",
              value: state.referralRewardAmount,
              appliesTo: ["venta", "alquiler"],
              startDate: now,
              isActive: true,
              createdAt: now,
              usedCount: 0,
            } as Promotion,
          ];
        }

        const tenantSafeItems = tenantId
          ? state.items.filter((i) => i.product?.tenantId === tenantId)
          : state.items;

        // 🔹 3. Calcular subtotal base
        const cartSubtotal = tenantSafeItems.reduce(
          (acc, item) =>
            acc +
            calculateSubtotal(
              {
                product: item.product,
                unitPrice: item.listPrice ?? item.unitPrice,
                quantity: item.quantity,
              },
              rentalDates,
              item.operationType,
            ),
          0,
        );

        const tenantSafePromotions = promotions.filter(
          (promotion: Promotion) =>
            !promotion.tenantId || promotion.tenantId === tenantId,
        );

        // 🔹 4. Detección y aplicación de BUNDLES (Combos)
        const products = useInventoryStore.getState().products;
        const bundleDefinitions = bundleService.createBundleDefinitionsFromPromotions(
            tenantSafePromotions,
            products,
            tenantId ?? undefined
        );

        let finalItemsForSubtotal = tenantSafeItems;

        if (bundleDefinitions.length > 0) {
            const config = useTenantConfigStore.getState().config;
            
            // 🛡️ Si la configuración no ha cargado, saltamos la aplicación de bundles
            // para evitar errores de referencia nula en el motor de precios.
            if (config) {
              const inventoryItems = useInventoryStore.getState().inventoryItems;
              const stockLots = useInventoryStore.getState().stockLots;
              const productVariants = useInventoryStore.getState().productVariants;
              const policy = useTenantConfigStore.getState().policy;

              // Ordenar por valor de descuento (mejor combo primero)
              const sortedBundles = [...bundleDefinitions].sort((a, b) => b.discountValue - a.discountValue);

              for (const bundleDef of sortedBundles) {
                  const { cart, eligibility } = bundleService.applyBundleToCart(
                      finalItemsForSubtotal,
                      bundleDef,
                      tenantId!,
                      branchId,
                      rentalDates?.from ?? now,
                      rentalDates?.to ?? now,
                      tenantSafePromotions,
                      config,
                      policy,
                      inventoryItems,
                      stockLots,
                      productVariants
                  );
                  if (eligibility.eligible) {
                      finalItemsForSubtotal = cart;
                  }
              }
            }
        }

        const promotedItems = promotionService.applyPromotionsUseCase(
          finalItemsForSubtotal,
          tenantSafePromotions,
          {
            branchId,
            cartSubtotal,
            now,
          },
        );

        const updatedItems = promotedItems.map((item) => {
          const listPrice = item.listPrice ?? item.unitPrice;
          const discountAmount = item.discountAmount ?? 0;
          const discountPercent =
            listPrice > 0
              ? Math.round(((discountAmount / listPrice) * 100) * 100) / 100
              : 0;
          const requiresAdminAuth = Boolean(
            useTenantConfigStore.getState().config?.pricing
              .requirePinForHighDiscount &&
              discountPercent >=
                (useTenantConfigStore.getState().config?.pricing
                  .highDiscountThreshold ?? 0),
          );

          return {
            ...item,
            requiresAdminAuth,
            subtotal: calculateSubtotal(
              {
                product: item.product,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                variantId: item.variantId,
              },
              rentalDates,
              item.operationType,
            ),
          };
        });

        const currentItems = state.items;
        const hasSameLength = currentItems.length === updatedItems.length;
        const hasChanges =
          !hasSameLength ||
          updatedItems.some((next, index) => {
            const prev = currentItems[index];
            if (!prev) return true;
            return (
              next.cartId !== prev.cartId ||
              next.unitPrice !== prev.unitPrice ||
              (next.discountAmount ?? 0) !== (prev.discountAmount ?? 0) ||
              (next.discountReason ?? "") !== (prev.discountReason ?? "") ||
              (next.appliedPromotionId ?? "") !==
                (prev.appliedPromotionId ?? "") ||
              (next.bundleId ?? "") !== (prev.bundleId ?? "") ||
              next.subtotal !== prev.subtotal
            );
          });

        if (hasChanges) {
          set({ items: updatedItems });
        }
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        customerId: state.customerId,
        activeBundles: state.activeBundles,
        activeTenantId: state.activeTenantId,
        appliedCouponCode: state.appliedCouponCode,
        manualPromotionId: state.manualPromotionId,
        referralRewardAmount: state.referralRewardAmount,
      }), // Dates cannot be easily JSON serialized so we skip them, or if we serialize we need to parse them back on hydrate
    },
  ),
);
