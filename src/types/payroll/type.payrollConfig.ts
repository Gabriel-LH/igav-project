import z from "zod";

export const payrollConfigSchema = z.object({
  id: z.string(),
  membershipId: z.string(),

  salaryType: z.enum(["monthly", "hourly"]),
  baseSalary: z.number(),

  extraHourRate: z.number().optional(),

  createdAt: z.date(),
});

export type PayrollConfig = z.infer<typeof payrollConfigSchema>;