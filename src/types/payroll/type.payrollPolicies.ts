import z from "zod";

export const payrollPolicySchema = z.object({
  id: z.string(),
  tenantId: z.string(),

  deductions: z.object({
    healthInsurancePercent: z.number(),
    pensionPercent: z.number(),
    taxPercent: z.number(),
  }),

  overtimeMultiplier: z.number(),

  updatedAt: z.date(),
});

export type PayrollPolicy = z.infer<typeof payrollPolicySchema>;
