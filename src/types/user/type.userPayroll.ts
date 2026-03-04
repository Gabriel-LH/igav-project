import z from "zod";

export const userPayrollSchema = z.object({
  id: z.string(),
  membershipId: z.string(),

  month: z.number().min(1).max(12),
  year: z.number(),

  baseSalary: z.number(),

  workedMinutes: z.number(),
  extraMinutes: z.number(),

  deductions: z.number().default(0),

  totalCalculated: z.number(),
  totalPaid: z.number().optional(),

  status: z.enum(["draft", "calculated", "paid"]),

  createdAt: z.date(),
});

export type UserPayroll = z.infer<typeof userPayrollSchema>;
