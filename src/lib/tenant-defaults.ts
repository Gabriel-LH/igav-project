import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import type { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";

export const DEFAULT_TENANT_CONFIG: Omit<TenantConfig, "tenantId" | "createdAt"> = {
  currency: "PEN",
  tax: {
    rate: 0.18,
    calculationMode: "TAX_EXCLUDED",
    rounding: {
      strategy: "FLOOR",
      applyOn: "TOTAL",
      roundTo: 0.10,
    },
  },
  pricing: {
    pricePrecision: 2,
    allowDiscountStacking: true,
    maxDiscountLimit: 50,
    requirePinForHighDiscount: true,
    highDiscountThreshold: 20,
  },
  loyalty: {
    enabled: true,
    earnRate: 0.1,
    redemptionValue: 1,
    minPointsToRedeem: 100,
  },
  cash: {
    paymentMethods: [],
    openingCashRequired: true,
    requireClosingReport: true,
  },
  referrals: {
    enabled: true,
    rewardType: "loyalty_points",
    rewardValue: 100,
    couponDiscountType: "percentage",
    triggerCondition: "first_purchase",
  },
  defaultTransferTime: 2,
};

export const DEFAULT_TENANT_POLICY_SECTIONS: Omit<
  TenantPolicy,
  "id" | "tenantId" | "version" | "isActive" | "createdAt" | "updatedBy" | "changeReason"
> = {
  sales: {
    allowReturns: true,
    maxReturnHours: 72,
    maxCancelHours: 24,
    allowPriceEdit: false,
    requireReasonForCancel: true,
    requireOriginalTicket: true,
    allowPartialReturns: true,
  },
  rentals: {
    allowLateReturn: true,
    lateToleranceHours: 2,
    lateFeeType: "fixed",
    lateFeeValue: 0,
    defaultRentalDurationDays: 3,
    minRentalDurationDays: 1,
    requireGuarantee: true,
    inclusiveDayCalculation: true,
  },
  reservations: {
    autoExpireReservations: true,
    expireAfterHours: 24,
    requireDownPayment: false,
    minDownPaymentPercentage: 0,
  },
  inventory: {
    autoOrderThreshold: 5,
  },
  financial: {
    allowInstallments: false,
  },
  security: {
    requirePinForCancelOperation: true,
    requirePinForManualPriceEdit: true,
    requireManagerApprovalForVoid: true,
  },
};
