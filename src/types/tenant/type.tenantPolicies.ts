import { z } from "zod";

export const tenantPoliciesSchema = z.object({
  id: z.string(),

  tenantId: z.string(),

  version: z.number(),

  isActive: z.boolean().default(true),

  sales: z.object({
    allowReturns: z.boolean(),
    maxReturnDays: z.number(),
    allowPriceEdit: z.boolean(),
    requireReasonForCancel: z.boolean(),
    autoCompleteDelivery: z.boolean(),
  }),

  rentals: z.object({
    allowLateReturn: z.boolean(),
    lateToleranceHours: z.number(),
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

  createdAt: z.date(),
  updatedBy: z.string(),
  changeReason: z.string().optional(),
});

export type TenantPolicies = z.infer<typeof tenantPoliciesSchema>;
