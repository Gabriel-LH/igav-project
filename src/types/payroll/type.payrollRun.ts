import z from "zod";

export const payrollRunSchema = z.object({
  id: z.string(),

  branchId: z.string(),

  periodStart: z.date(),
  periodEnd: z.date(),

  payDate: z.date(),

  status: z.enum(["draft", "processing", "finalized", "paid"]),

  createdAt: z.date(),
});

export type PayrollRun = z.infer<typeof payrollRunSchema>;
