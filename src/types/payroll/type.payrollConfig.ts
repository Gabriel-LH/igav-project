import { z } from "zod";

export const payrollConfigSchema = z.object({
  id: z.string(),

  membershipId: z.string(),

  salaryType: z.enum(["monthly", "hourly"]),

  baseSalary: z.number().optional(),

  hourlyRate: z.number().optional(),

  paySchedule: z.enum([
    "weekly",
    "biweekly",
    "semimonthly",
    "monthly",
    "manual",
  ]),

  applyOvertime: z.boolean().default(true),
  applyhealthInsurancePercent: z.boolean(),
  applypensionPercent: z.boolean(),
  applytaxPercent: z.boolean(),
  otherDeductions: z.number(),

  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PayrollConfig = z.infer<typeof payrollConfigSchema>;
