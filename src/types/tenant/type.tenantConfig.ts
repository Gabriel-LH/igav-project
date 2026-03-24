import { z } from "zod";
import { PaymentMethod, paymentMethodSchema } from "@/src/types/payments/type.paymentMethod";

export const tenantConfigSchema = z.object({
  tenantId: z.string(),

  currency: z.string().default("PEN"),

  tax: z.object({
    rate: z.number().default(0.18),

    calculationMode: z.enum(["TAX_INCLUDED", "TAX_EXCLUDED"]),

    rounding: z.object({
      strategy: z
        .enum(["HALF_UP", "HALF_EVEN", "FLOOR", "CEIL"])
        .default("HALF_UP"),

      applyOn: z.enum(["LINE", "TOTAL"]).default("TOTAL"),

      roundTo: z.number().default(0.01),
    }),
  }),
  pricing: z.object({
    allowNegativeStock: z.boolean().default(false),
    pricePrecision: z.number().default(2),
  }),

  discounts: z.object({
    maxPercentageAllowed: z.number(),
    requireAdminAuthOver: z.number(),
    allowStacking: z.boolean(),
  }),

  loyalty: z.object({
    enabled: z.boolean(),
    earnRate: z.number(),
    redemptionValue: z.number(),
    minPointsToRedeem: z.number(),
    expirePointsAfterDays: z.number().optional(),
  }),

  cash: z.object({
    paymentMethods: z.array(paymentMethodSchema).default([]),
    openingCashRequired: z.boolean().default(true),
    requireClosingReport: z.boolean().default(true),
    allowNegativeCash: z.boolean().default(false),
  }),
  defaultTransferTime: z.number().default(2),
  createdAt: z.date(),
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
