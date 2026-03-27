import { TenantConfig } from "@/src/types/tenant/type.tenantConfig";

export type TaxTotals = {
  subtotal: number;
  taxAmount: number;
  total: number;
};

const roundValue = (
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

export const calculateTaxTotals = (
  baseAmount: number,
  taxConfig: TenantConfig["tax"],
): TaxTotals => {
  const taxableBase = Math.max(0, baseAmount);
  const rate = taxConfig.rate ?? 0;

  let subtotal = taxableBase;
  let taxAmount = 0;
  let total = taxableBase;

  if (taxConfig.calculationMode === "TAX_INCLUDED") {
    subtotal = taxableBase / (1 + rate);
    taxAmount = taxableBase - subtotal;
    total = taxableBase;
  } else {
    subtotal = taxableBase;
    taxAmount = taxableBase * rate;
    total = taxableBase + taxAmount;
  }

  if (taxConfig.rounding?.applyOn === "TOTAL") {
    const roundTo = taxConfig.rounding.roundTo ?? 0.01;
    const strategy = taxConfig.rounding.strategy ?? "HALF_UP";
    subtotal = roundValue(subtotal, roundTo, strategy);
    taxAmount = roundValue(taxAmount, roundTo, strategy);
    total = roundValue(total, roundTo, strategy);
  }

  return {
    subtotal,
    taxAmount,
    total,
  };
};
