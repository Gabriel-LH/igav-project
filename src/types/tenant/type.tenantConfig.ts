import { z } from "zod";
import { paymentMethodSchema } from "@/src/types/payments/type.paymentMethod";

export const transferRouteConfigSchema = z.object({
  id: z.string(),
  originBranchId: z.string(),
  destinationBranchId: z.string(),
  estimatedTimeHours: z.number().min(0),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const tenantConfigSchema = z
  .object({
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
      pricePrecision: z.number().default(2),
      allowDiscountStacking: z.boolean().default(true),
      maxDiscountLimit: z.number().min(0).max(100).default(50),
      requirePinForHighDiscount: z.boolean().default(true),
      highDiscountThreshold: z.number().min(0).max(100).default(20),
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
    }),
    referrals: z.object({
      enabled: z.boolean().default(true),
      rewardType: z
        .enum(["discount_coupon", "loyalty_points"])
        .default("loyalty_points"),
      rewardValue: z.number().default(100),
      couponDiscountType: z
        .enum(["percentage", "fixed_amount"])
        .default("percentage"),
      couponExpiresInDays: z.number().optional(),
      triggerCondition: z
        .enum(["first_purchase", "first_payment"])
        .default("first_purchase"),
    }),
    defaultTransferTime: z.number().default(2),
    transferRoutes: z.array(transferRouteConfigSchema).default([]),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
  })
  .superRefine(({ pricing }, ctx) => {
    if (
      pricing.requirePinForHighDiscount &&
      pricing.highDiscountThreshold > pricing.maxDiscountLimit
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pricing", "highDiscountThreshold"],
        message:
          "El umbral para pedir PIN no puede ser mayor al descuento maximo permitido.",
      });
    }
  });

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type TransferRouteConfig = z.infer<typeof transferRouteConfigSchema>;
