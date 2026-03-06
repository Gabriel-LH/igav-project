import z from "zod";

export const payrollItemSchema = z.object({
  id: z.string(),

  payrollRunId: z.string(),

  membershipId: z.string(),

  grossTotal: z.number(),

  deductionTotal: z.number(),

  netTotal: z.number(),

  status: z.enum(["draft", "calculated", "paid"]),
});

export type PayrollItem = z.infer<typeof payrollItemSchema>;
