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
  createdAt: z.date(),
  createdBy: z.string(),
  updatedAt: z.date(),
  updatedBy: z.string(),
});

export type PayrollPolicy = z.infer<typeof payrollPolicySchema>;
