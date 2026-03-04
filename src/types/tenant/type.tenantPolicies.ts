import { z } from "zod";

export const tenantPoliciesSchema = z.object({
  tenantId: z.string(),

  sales: z.object({
    allowReturns: z.boolean(),
    maxReturnDays: z.number(),
    allowPriceEdit: z.boolean(),
    requireReasonForCancel: z.boolean(),
    autoCompleteDelivery: z.boolean(),
  }),

  rentals: z.object({
    allowLateReturn: z.boolean(),
    lateToleranceHours: z.number(), // horas de gracia
    autoMarkAsLate: z.boolean(),
    requireGuarantee: z.boolean(),
    allowRentalWithoutStockAssigned: z.boolean(),
    autoMoveToLaundryOnReturn: z.boolean(),
    autoMoveToMaintenanceIfDamaged: z.boolean(),
  }),

  reservations: z.object({
    autoExpireReservations: z.boolean(),
    expireAfterHours: z.number(),
    allowOverbooking: z.boolean(),
    requireDeposit: z.boolean(),
    autoConvertOnPickup: z.boolean(),
  }),

  inventory: z.object({
    allowManualAdjustments: z.boolean(),
    requireReasonForAdjustment: z.boolean(),
    autoBlockStockIfReserved: z.boolean(),
  }),

  financial: z.object({
    allowNegativeBalance: z.boolean(),
    autoApplyChargesOnDamage: z.boolean(),
  }),

  security: z.object({
    requirePinForHighDiscount: z.boolean(),
    requirePinForCancelOperation: z.boolean(),
    requirePinForManualPriceEdit: z.boolean(),
  }),

  updatedAt: z.date(),
});

export type TenantPolicies = z.infer<typeof tenantPoliciesSchema>;
