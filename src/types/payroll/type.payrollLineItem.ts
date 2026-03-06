import z from "zod";

export const payrollLineItemSchema = z.object({
  id: z.string(),

  payrollItemId: z.string(),

  type: z.enum(["earning", "deduction"]),

  category: z.enum([
    "salary",
    "hourly",
    "overtime",
    "bonus",
    "commission",
    "tax",
    "pension",
    "health_insurance",
    "advance",
    "penalty",
    "adjustment",
  ]),

  name: z.string(),

  amount: z.number(),

  quantity: z.number().optional(),

  rate: z.number().optional(),

  createdAt: z.date(),
});

export type PayrollLineItem = z.infer<typeof payrollLineItemSchema>;
