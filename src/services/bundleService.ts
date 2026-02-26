import { differenceInDays } from "date-fns";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { PROMOTIONS_MOCK } from "@/src/mocks/mock.promotions";
import { Promotion } from "@/src/types/promotion/type.promotion";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { CartItem } from "@/src/types/cart/type.cart";
import { applyPricingEngine } from "@/src/utils/pricing/applyPricingEngine";
import { getAvailabilityByAttributes } from "@/src/utils/reservation/checkAvailability";

export interface BundleDefinition {
  id: string;
  tenantId?: string;
  name: string;
  requiredItems: Array<{ productId: string; quantity: number }>;
  discountType: "percentage" | "fixed";
  discountValue: number;
  appliesTo: ("venta" | "alquiler")[];
}

type PromotionBundleConfig = {
  requiredProductIds: string[];
  bundlePrice: number;
  prorateStrategy: "proportional" | "equal";
};

const isBundlePromotion = (
  promotion: Promotion,
): promotion is Promotion & { bundleConfig: PromotionBundleConfig } =>
  promotion.type === "bundle" && Boolean(promotion.bundleConfig);

export interface BundleEligibilityResult {
  eligible: boolean;
  possibleCount: number;
  missingProducts: Array<{
    productId: string;
    required: number;
    availableInCart: number;
  }>;
  availabilityIssues: Array<{
    productId: string;
    required: number;
    available: number;
    reason: string;
  }>;
}

interface AvailabilityInput {
  productId: string;
  branchId: string;
  startDate: Date;
  endDate: Date;
  quantity: number;
  operationType: "alquiler" | "venta";
  sizeId?: string;
  colorId?: string;
}

interface AvailabilityResult {
  available: boolean;
  availableCount: number;
  reason?: string;
}

export type CheckAvailabilityFn = (
  input: AvailabilityInput,
) => AvailabilityResult;

export type ReserveStockFn = (input: AvailabilityInput) => Promise<void> | void;

export function createBundleDefinitionsFromPromotions(tenantId?: string) {
  const { products } = useInventoryStore.getState();

  return PROMOTIONS_MOCK.filter(isBundlePromotion)
    .filter(
      (promotion) =>
        !tenantId || !promotion.tenantId || promotion.tenantId === tenantId,
    )
    .map((promotion) => {
      const bundleProducts = promotion.bundleConfig.requiredProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is (typeof products)[number] => Boolean(p));

      if (tenantId && bundleProducts.some((p) => p.tenantId !== tenantId)) {
        return null;
      }

      const cfg = promotion.bundleConfig as PromotionBundleConfig;
      const requiredItemsMap = new Map<string, number>();
      cfg.requiredProductIds.forEach((productId) => {
        requiredItemsMap.set(
          productId,
          (requiredItemsMap.get(productId) ?? 0) + 1,
        );
      });

      const discountType: "percentage" | "fixed" =
        typeof promotion.value === "number" && promotion.value > 0
          ? "percentage"
          : "fixed";

      const discountValue =
        discountType === "percentage"
          ? promotion.value!
          : promotion.bundleConfig.bundlePrice;

      return {
        id: promotion.id,
        tenantId: promotion.tenantId,
        name: promotion.name,
        requiredItems: Array.from(requiredItemsMap.entries()).map(
          ([productId, quantity]) => ({ productId, quantity }),
        ),
        discountType,
        discountValue,
        appliesTo: promotion.appliesTo,
      } as BundleDefinition;
    })
    .filter((v): v is BundleDefinition => Boolean(v));
}

const defaultCheckAvailability: CheckAvailabilityFn = (input) => {
  // Reusa el motor existente. branchId lo recibe por contrato para no romper
  // arquitectura de multi-sede, aunque el helper actual no expone branch como parámetro.
  if (!input.sizeId || !input.colorId) {
    return {
      available: false,
      availableCount: 0,
      reason: "Falta talla/color para validar disponibilidad",
    };
  }

  const result = getAvailabilityByAttributes(
    input.productId,
    input.sizeId,
    input.colorId,
    input.startDate,
    input.endDate,
    input.operationType,
  );

  return {
    available: result.availableCount >= input.quantity,
    availableCount: Math.max(0, result.availableCount),
    reason: result.reason,
  };
};

const operationMatchesBundle = (
  bundle: BundleDefinition,
  operationType: "venta" | "alquiler",
) => {
  return bundle.appliesTo.includes(operationType);
};

const rentalMultiplier = (item: CartItem, startDate: Date, endDate: Date) => {
  if (item.operationType !== "alquiler") return 1;
  if (item.product.rent_unit === "evento") return 1;
  return Math.max(differenceInDays(endDate, startDate), 1);
};

const cloneWithoutBundle = (
  cart: CartItem[],
  startDate: Date,
  endDate: Date,
): CartItem[] => {
  return cart.map((item) => {
    const listPrice = item.listPrice ?? item.unitPrice;
    const pricing = applyPricingEngine({
      product: item.product,
      operationType: item.operationType,
      listPrice,
      promotions: [],
      businessRules: BUSINESS_RULES_MOCK,
    });
    const unitPrice = pricing.priceAtMoment;
    const subtotal =
      unitPrice * item.quantity * rentalMultiplier(item, startDate, endDate);

    return {
      ...item,
      unitPrice,
      listPrice,
      discountAmount: pricing.discountAmount,
      discountReason: pricing.discountReason,
      appliedPromotionId: pricing.promotionId,
      bundleId: undefined,
      subtotal,
    };
  });
};

const isItemInBranch = (item: CartItem, branchId: string) => {
  if (item.selectedCodes.length === 0) return true;
  const { inventoryItems, stockLots } = useInventoryStore.getState();

  return item.selectedCodes.every((code) => {
    const serial = inventoryItems.find((s) => s.id === code);
    if (serial) return serial.branchId === branchId;
    const lot = stockLots.find((l) => l.id === code || l.variantCode === code);
    if (lot) return lot.branchId === branchId;
    return true;
  });
};

export function detectBundleEligibility(
  cart: CartItem[],
  bundleDefinition: BundleDefinition,
  tenantId: string,
  branchId: string,
  startDate: Date,
  endDate: Date,
  checkAvailability: CheckAvailabilityFn = defaultCheckAvailability,
): BundleEligibilityResult {
  const hasCrossTenantItem = cart.some(
    (item) => item.product.tenantId !== tenantId,
  );
  if (hasCrossTenantItem) {
    return {
      eligible: false,
      possibleCount: 0,
      missingProducts: [],
      availabilityIssues: [
        {
          productId: "tenant_scope",
          required: 0,
          available: 0,
          reason: "El carrito tiene productos de otro tenant",
        },
      ],
    };
  }

  if (bundleDefinition.tenantId && bundleDefinition.tenantId !== tenantId) {
    return {
      eligible: false,
      possibleCount: 0,
      missingProducts: [],
      availabilityIssues: [
        {
          productId: "tenant_scope",
          required: 0,
          available: 0,
          reason: "El bundle no pertenece al tenant activo",
        },
      ],
    };
  }

  const eligibleItems = cart.filter(
    (item) =>
      item.product.tenantId === tenantId &&
      operationMatchesBundle(bundleDefinition, item.operationType) &&
      isItemInBranch(item, branchId),
  );

  const quantityByProduct = new Map<string, number>();
  eligibleItems.forEach((item) => {
    quantityByProduct.set(
      item.product.id,
      (quantityByProduct.get(item.product.id) ?? 0) + item.quantity,
    );
  });

  const missingProducts = bundleDefinition.requiredItems
    .map((required) => {
      const availableInCart = quantityByProduct.get(required.productId) ?? 0;
      return {
        productId: required.productId,
        required: required.quantity,
        availableInCart,
      };
    })
    .filter((entry) => entry.availableInCart < entry.required);

  if (missingProducts.length > 0) {
    return {
      eligible: false,
      possibleCount: 0,
      missingProducts,
      availabilityIssues: [],
    };
  }

  let possibleCount = Number.MAX_SAFE_INTEGER;
  bundleDefinition.requiredItems.forEach((required) => {
    const available = quantityByProduct.get(required.productId) ?? 0;
    const supported = Math.floor(available / required.quantity);
    possibleCount = Math.min(possibleCount, supported);
  });

  if (!Number.isFinite(possibleCount) || possibleCount <= 0) {
    return {
      eligible: false,
      possibleCount: 0,
      missingProducts: [],
      availabilityIssues: [],
    };
  }

  const availabilityIssues: BundleEligibilityResult["availabilityIssues"] = [];

  if (bundleDefinition.appliesTo.includes("alquiler")) {
    bundleDefinition.requiredItems.forEach((required) => {
      const matchingLines = eligibleItems.filter(
        (item) =>
          item.operationType === "alquiler" &&
          item.product.id === required.productId,
      );

      let availableForRange = 0;
      matchingLines.forEach((line) => {
        const check = checkAvailability({
          productId: line.product.id,
          branchId,
          startDate,
          endDate,
          quantity: line.quantity,
          operationType: "alquiler",
          sizeId: line.selectedSizeId,
          colorId: line.selectedColorId,
        });
        availableForRange += Math.max(0, check.availableCount);
      });

      const requiredForBundles = required.quantity * possibleCount;
      if (availableForRange < requiredForBundles) {
        availabilityIssues.push({
          productId: required.productId,
          required: requiredForBundles,
          available: availableForRange,
          reason: "No hay disponibilidad suficiente en el rango/branch",
        });
      } else {
        const byAvailability = Math.floor(
          availableForRange / required.quantity,
        );
        possibleCount = Math.min(possibleCount, byAvailability);
      }
    });
  }

  const finalEligible = possibleCount > 0 && availabilityIssues.length === 0;
  return {
    eligible: finalEligible,
    possibleCount: finalEligible ? possibleCount : 0,
    missingProducts: [],
    availabilityIssues,
  };
}

export function applyBundleToCart(
  cart: CartItem[],
  bundleDefinition: BundleDefinition,
  tenantId: string,
  branchId: string,
  startDate: Date,
  endDate: Date,
  checkAvailability: CheckAvailabilityFn = defaultCheckAvailability,
): { cart: CartItem[]; eligibility: BundleEligibilityResult } {
  const eligibility = detectBundleEligibility(
    cart,
    bundleDefinition,
    tenantId,
    branchId,
    startDate,
    endDate,
    checkAvailability,
  );

  if (!eligibility.eligible || eligibility.possibleCount <= 0) {
    return { cart: cloneWithoutBundle(cart, startDate, endDate), eligibility };
  }

  const baseCart = cloneWithoutBundle(cart, startDate, endDate);
  const requiredTotalByProduct = new Map<string, number>();
  bundleDefinition.requiredItems.forEach((required) => {
    requiredTotalByProduct.set(
      required.productId,
      required.quantity * eligibility.possibleCount,
    );
  });

  const consumedByLine = new Map<string, number>();
  baseCart.forEach((line) => {
    const remainingForProduct =
      requiredTotalByProduct.get(line.product.id) ?? 0;
    if (remainingForProduct <= 0) return;
    if (line.product.tenantId !== tenantId) return;
    if (!operationMatchesBundle(bundleDefinition, line.operationType)) return;
    const consume = Math.min(line.quantity, remainingForProduct);
    if (consume > 0) {
      consumedByLine.set(line.cartId, consume);
      requiredTotalByProduct.set(
        line.product.id,
        remainingForProduct - consume,
      );
    }
  });

  const consumedLines = baseCart
    .filter((line) => (consumedByLine.get(line.cartId) ?? 0) > 0)
    .map((line) => {
      const consumedQty = consumedByLine.get(line.cartId) ?? 0;
      const listPrice = line.listPrice ?? line.unitPrice;
      return { line, consumedQty, listPrice };
    });

  // 1️⃣ Agrupar líneas consumidas por operationType
  const groups = new Map<
    "venta" | "alquiler",
    {
      lines: typeof consumedLines;
      total: number;
    }
  >();

  consumedLines.forEach((entry) => {
    const op = entry.line.operationType;
    const multiplier = rentalMultiplier(entry.line, startDate, endDate);
    const lineTotal = entry.listPrice * entry.consumedQty * multiplier;

    const existing = groups.get(op);
    if (!existing) {
      groups.set(op, {
        lines: [entry],
        total: lineTotal,
      });
    } else {
      existing.lines.push(entry);
      existing.total += lineTotal;
    }
  });

  const sharedBundleGroupId = crypto.randomUUID();

  // 2️⃣ Calcular factores de ajuste

  // Total global de todas las líneas consumidas
  const globalTotal = Array.from(groups.values()).reduce(
    (acc, g) => acc + g.total,
    0,
  );

  const groupFactors = new Map<"venta" | "alquiler", number>();

  if (globalTotal <= 0) {
    groups.forEach((_, op) => groupFactors.set(op, 1));
  } else {
    if (bundleDefinition.discountType === "percentage") {
      // 🔹 Descuento proporcional por grupo
      groups.forEach((group, op) => {
        const discountTotal =
          (group.total * bundleDefinition.discountValue) / 100;

        const finalTotal = Math.max(0, group.total - discountTotal);
        const factor = finalTotal / group.total;

        groupFactors.set(op, factor);
      });
    } else {
      // 🔹 FIXED = bundlePrice FINAL GLOBAL
      const finalGlobalTotal = Math.max(0, bundleDefinition.discountValue);

      const globalFactor = globalTotal > 0 ? finalGlobalTotal / globalTotal : 1;

      // aplicar mismo factor proporcional a cada grupo
      groups.forEach((group, op) => {
        groupFactors.set(op, globalFactor);
      });
    }
  }

  const result: CartItem[] = [];
  baseCart.forEach((line) => {
    const consumedQty = consumedByLine.get(line.cartId) ?? 0;
    const listPrice = line.listPrice ?? line.unitPrice;

    if (consumedQty <= 0) {
      result.push(line);
      return;
    }

    if (line.quantity > consumedQty) {
      const remainingQty = line.quantity - consumedQty;
      result.push({
        ...line,
        cartId: crypto.randomUUID(),
        quantity: remainingQty,
        subtotal:
          line.unitPrice *
          remainingQty *
          rentalMultiplier(line, startDate, endDate),
      });
    }

    const factor = groupFactors.get(line.operationType) ?? 1;

    const multiplier = rentalMultiplier(line, startDate, endDate);
    const baseLineTotal = listPrice * multiplier;

    // ajustamos el total y luego regresamos a unitario
    const adjustedLineTotal = baseLineTotal * factor;
    const proratedUnitPrice = adjustedLineTotal / multiplier;

    const pricing = applyPricingEngine({
      product: line.product,
      operationType: line.operationType,
      listPrice,
      promotions: PROMOTIONS_MOCK,
      businessRules: BUSINESS_RULES_MOCK,
      explicitBundle: {
        promotionId: bundleDefinition.id,
        bundleId: sharedBundleGroupId,
        priceAtMoment: proratedUnitPrice,
      },
      manualDiscountReason: bundleDefinition.name,
    });

    result.push({
      ...line,
      cartId: crypto.randomUUID(),
      quantity: consumedQty,
      unitPrice: pricing.priceAtMoment,
      listPrice: pricing.listPrice,
      discountAmount: pricing.discountAmount,
      discountReason: bundleDefinition.name,
      appliedPromotionId: bundleDefinition.id,
      bundleId: sharedBundleGroupId,
      subtotal:
        pricing.priceAtMoment *
        consumedQty *
        rentalMultiplier(line, startDate, endDate),
    });
  });

  return {
    cart: result,
    eligibility,
  };
}

export function clearBundleAssignments(
  cart: CartItem[],
  startDate: Date,
  endDate: Date,
): CartItem[] {
  return cloneWithoutBundle(cart, startDate, endDate);
}

export async function reserveBundledItems(
  cart: CartItem[],
  tenantId: string,
  branchId: string,
  startDate: Date,
  endDate: Date,
  reserveStock: ReserveStockFn,
): Promise<void> {
  const grouped = new Map<string, { item: CartItem; quantity: number }>();

  cart
    .filter((item) => item.bundleId && item.product.tenantId === tenantId)
    .forEach((item) => {
      const key = [
        item.bundleId,
        item.product.id,
        item.operationType,
        item.selectedSizeId ?? "",
        item.selectedColorId ?? "",
      ].join("::");

      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, { item, quantity: item.quantity });
      } else {
        current.quantity += item.quantity;
      }
    });

  for (const { item, quantity } of grouped.values()) {
    await reserveStock({
      productId: item.product.id,
      branchId,
      startDate,
      endDate,
      quantity,
      operationType: item.operationType,
      sizeId: item.selectedSizeId,
      colorId: item.selectedColorId,
    });
  }
}

export const reserveStockUsingInventory: ReserveStockFn = (input) => {
  const inventoryStore = useInventoryStore.getState();
  const { inventoryItems, stockLots } = inventoryStore;
  const { products } = inventoryStore;
  const expectedTenantId = products.find(
    (p) => p.id === input.productId,
  )?.tenantId;
  if (!expectedTenantId) return;
  let remaining = input.quantity;

  const serialCandidates = inventoryItems.filter(
    (item) =>
      item.productId === input.productId &&
      item.tenantId === expectedTenantId &&
      item.branchId === input.branchId &&
      item.status === "disponible" &&
      (input.operationType === "alquiler" ? item.isForRent : item.isForSale) &&
      (!input.sizeId || item.sizeId === input.sizeId) &&
      (!input.colorId || item.colorId === input.colorId),
  );

  for (const serial of serialCandidates) {
    if (remaining <= 0) break;
    inventoryStore.updateItemStatus(serial.id, "reservado", input.branchId);
    remaining -= 1;
  }

  if (remaining <= 0) return;

  const lotCandidates = stockLots
    .filter(
      (lot) =>
        lot.productId === input.productId &&
        products.some(
          (p) => p.id === lot.productId && p.tenantId === expectedTenantId,
        ) &&
        lot.branchId === input.branchId &&
        lot.status === "disponible" &&
        (input.operationType === "alquiler" ? lot.isForRent : lot.isForSale) &&
        (!input.sizeId || lot.sizeId === input.sizeId) &&
        (!input.colorId || lot.colorId === input.colorId),
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (const lot of lotCandidates) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, lot.quantity);
    if (take > 0) {
      inventoryStore.decreaseLotQuantity(lot.id, take);
      remaining -= take;
    }
  }
};

export const releaseStockUsingInventory: ReserveStockFn = (input) => {
  const inventoryStore = useInventoryStore.getState();
  const { inventoryItems, stockLots } = inventoryStore;
  const { products } = inventoryStore;
  const expectedTenantId = products.find(
    (p) => p.id === input.productId,
  )?.tenantId;
  if (!expectedTenantId) return;
  let remaining = input.quantity;

  const serialCandidates = inventoryItems.filter(
    (item) =>
      item.productId === input.productId &&
      item.tenantId === expectedTenantId &&
      item.branchId === input.branchId &&
      item.status === "reservado" &&
      (input.operationType === "alquiler" ? item.isForRent : item.isForSale) &&
      (!input.sizeId || item.sizeId === input.sizeId) &&
      (!input.colorId || item.colorId === input.colorId),
  );

  for (const serial of serialCandidates) {
    if (remaining <= 0) break;
    inventoryStore.updateItemStatus(serial.id, "disponible", input.branchId);
    remaining -= 1;
  }

  if (remaining <= 0) return;

  const lotCandidates = stockLots.filter(
    (lot) =>
      lot.productId === input.productId &&
      products.some(
        (p) => p.id === lot.productId && p.tenantId === expectedTenantId,
      ) &&
      lot.branchId === input.branchId &&
      (input.operationType === "alquiler" ? lot.isForRent : lot.isForSale) &&
      (!input.sizeId || lot.sizeId === input.sizeId) &&
      (!input.colorId || lot.colorId === input.colorId),
  );

  if (lotCandidates.length > 0) {
    inventoryStore.increaseLotQuantity(lotCandidates[0].id, remaining);
  }
};
