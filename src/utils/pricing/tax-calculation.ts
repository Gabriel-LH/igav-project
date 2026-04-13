import { TenantConfig } from "@/src/types/tenant/type.tenantConfig";

export type TaxTotals = {
  subtotal: number;
  taxAmount: number;
  total: number;
  totalBeforeRounding: number;
  roundingDifference: number;
};

export const roundValue = (
  value: number,
  roundTo: number,
  strategy: TenantConfig["tax"]["rounding"]["strategy"],
): number => {
  const factor = 1 / (roundTo || 1);
  const scaled = value * factor;

  let rounded = scaled;
  switch (strategy) {
    case "FLOOR":
      rounded = Math.floor(scaled);
      break;
    case "CEIL":
      rounded = Math.ceil(scaled);
      break;
    case "HALF_EVEN": {
      const floor = Math.floor(scaled);
      const diff = scaled - floor;
      if (diff > 0.5) {
        rounded = floor + 1;
      } else if (diff < 0.5) {
        rounded = floor;
      } else {
        rounded = floor % 2 === 0 ? floor : floor + 1;
      }
      break;
    }
    case "HALF_UP":
    default:
      rounded = Math.round(scaled);
      break;
  }

  const result = rounded / factor;
  return Number(result.toFixed(8));
};

/**
 * Calculate tax totals with optional rounding.
 *
 * @param baseAmount - The base amount to calculate tax on.
 * @param taxConfig - The tenant's tax configuration.
 * @param paymentMethodType - The payment method type. Rounding is only applied
 *   for "cash" payments (or when unspecified for backwards compatibility).
 * @param items - Optional list of item amounts for line-level rounding.
 */
export const calculateTaxTotals = (
  baseAmount: number,
  taxConfig: TenantConfig["tax"],
  paymentMethodType?: "cash" | "digital" | "card" | "transfer",
  items?: { amount: number }[],
): TaxTotals => {
  const rate = taxConfig.rate ?? 0;
  const isCash = !paymentMethodType || paymentMethodType === "cash";
  const roundTo = taxConfig.rounding?.roundTo ?? 0.01;
  const strategy = taxConfig.rounding?.strategy ?? "HALF_UP";
  const applyOn = taxConfig.rounding?.applyOn ?? "TOTAL";

  let subtotal = 0;
  let taxAmount = 0;
  let total = 0;

  if (items && items.length > 0 && applyOn === "LINE" && isCash) {
    // Line-level rounding logic
    items.forEach((item) => {
      let lSub = 0;
      let lTax = 0;
      let lTotal = 0;

      if (taxConfig.calculationMode === "TAX_INCLUDED") {
        lTotal = item.amount;
        lSub = lTotal / (1 + rate);
        lTax = lTotal - lSub;
      } else {
        lSub = item.amount;
        lTax = lSub * rate;
        lTotal = lSub + lTax;
      }

      subtotal += roundValue(lSub, roundTo, strategy);
      taxAmount += roundValue(lTax, roundTo, strategy);
      total += roundValue(lTotal, roundTo, strategy);
    });
  } else {
    // Total-level rounding or no rounding
    const taxableBase = Math.max(0, baseAmount);
    if (taxConfig.calculationMode === "TAX_INCLUDED") {
      subtotal = taxableBase / (1 + rate);
      taxAmount = taxableBase - subtotal;
      total = taxableBase;
    } else {
      subtotal = taxableBase;
      taxAmount = taxableBase * rate;
      total = taxableBase + taxAmount;
    }

    if (isCash && applyOn === "TOTAL") {
      total = roundValue(total, roundTo, strategy);
      // Recalcular subtotal y tax basado en el total ya redondeado
      if (taxConfig.calculationMode === "TAX_INCLUDED") {
        subtotal = total / (1 + rate);
        taxAmount = total - subtotal;
      } else {
        subtotal = roundValue(subtotal, roundTo, strategy);
        taxAmount = total - subtotal;
      }
    }
  }

  const totalBeforeRounding = taxConfig.calculationMode === "TAX_INCLUDED" 
    ? baseAmount 
    : baseAmount * (1 + rate);

  return {
    subtotal: Number(subtotal.toFixed(8)),
    taxAmount: Number(taxAmount.toFixed(8)),
    total: Number(total.toFixed(8)),
    totalBeforeRounding: Number(totalBeforeRounding.toFixed(8)),
    roundingDifference: Number((total - totalBeforeRounding).toFixed(8)),
  };
};
