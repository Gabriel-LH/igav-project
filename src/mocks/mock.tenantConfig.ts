import { TenantConfig } from "../types/tenant/type.tenantConfig";
import { MOCK_PAYMENT_METHODS } from "./mock.paymentMethod";

export const MOCK_TENANT_CONFIG: TenantConfig = {
  tenantId: "tenant-1",
  currency: "PEN",
  tax: {
    rate: 0.18,
    calculationMode: "TAX_EXCLUDED",
    rounding: {
      strategy: "HALF_UP",
      applyOn: "TOTAL",
      roundTo: 0.01,
    },
  },
  pricing: {
    allowNegativeStock: false,
    pricePrecision: 2,
  },
  discounts: {
    maxPercentageAllowed: 50,
    requireAdminAuthOver: 20,
    allowStacking: true,
  },
  loyalty: {
    enabled: true,
    earnRate: 0.1,
    redemptionValue: 1,
    minPointsToRedeem: 100,
    expirePointsAfterDays: 365,
  },
  cash: {
    paymentMethods: MOCK_PAYMENT_METHODS,
    openingCashRequired: true,
    requireClosingReport: true,
    allowNegativeCash: false,
  },
  createdAt: new Date("2024-01-01"),
};

export const HAS_SALES = true;
