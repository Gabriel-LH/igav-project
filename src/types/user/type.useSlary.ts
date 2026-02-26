import z from "zod";

export const userPayrollSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  baseSalary: z.number(),
  extraHours: z.number().default(0),
  deductions: z.number().default(0),
  totalPaid: z.number(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

export type UserPayroll = z.infer<typeof userPayrollSchema>;
