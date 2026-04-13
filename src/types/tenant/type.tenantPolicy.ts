import { z } from "zod";

export const salesPolicySchema = z.object({
  allowReturns: z.boolean().default(true),
  maxReturnHours: z.number().min(0).default(72),
  maxCancelHours: z.number().min(0).default(24),
  allowPriceEdit: z.boolean().default(false),
  requireReasonForCancel: z.boolean().default(true),
  requireOriginalTicket: z.boolean().default(true),
  allowPartialReturns: z.boolean().default(true),
});

export const rentalsPolicySchema = z.object({
  allowLateReturn: z.boolean().default(true),
  lateToleranceHours: z.number().default(2),
  lateFeeType: z.enum(["fixed", "percentage_per_day"]).default("fixed"),
  lateFeeValue: z.number().default(0),
  defaultRentalDurationDays: z.number().default(3),
  minRentalDurationDays: z.number().default(1),
  requireGuarantee: z.boolean().default(true),
  inclusiveDayCalculation: z.boolean().default(true),
  chargePickupDay: z.boolean().default(true),
  chargeReturnDay: z.boolean().default(true),
});

export const reservationsPolicySchema = z.object({
  autoExpireReservations: z.boolean().default(true),
  expireAfterHours: z.number().default(24),
  requireDownPayment: z.boolean().default(false),
  minDownPaymentPercentage: z.number().default(0),
});

export const inventoryPolicySchema = z.object({
  autoOrderThreshold: z.number().default(5),
});

export const financialPolicySchema = z.object({
  allowInstallments: z.boolean().default(false),
});

export const securityPolicySchema = z.object({
  requirePinForCancelOperation: z.boolean().default(true),
  requirePinForManualPriceEdit: z.boolean().default(true),
  requireManagerApprovalForVoid: z.boolean().default(true),
});

export const tenantPolicySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  version: z.number(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedBy: z.string(),
  changeReason: z.string().optional(),

  sales: salesPolicySchema,
  rentals: rentalsPolicySchema,
  reservations: reservationsPolicySchema,
  inventory: inventoryPolicySchema,
  financial: financialPolicySchema,
  security: securityPolicySchema,
});

export type SalesPolicy = z.infer<typeof salesPolicySchema>;
export type RentalsPolicy = z.infer<typeof rentalsPolicySchema>;
export type ReservationsPolicy = z.infer<typeof reservationsPolicySchema>;
export type InventoryPolicy = z.infer<typeof inventoryPolicySchema>;
export type FinancialPolicy = z.infer<typeof financialPolicySchema>;
export type SecurityPolicy = z.infer<typeof securityPolicySchema>;
export type TenantPolicy = z.infer<typeof tenantPolicySchema>;
