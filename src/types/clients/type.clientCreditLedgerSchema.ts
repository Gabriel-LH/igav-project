import { z } from "zod";

export const clientCreditLedgerSchema = z.object({
  id: z.string(),
  clientId: z.string(),

  amount: z.number(), 
  // + positivo = crédito generado
  // - negativo = crédito usado

  reason: z.enum([
    "overpayment",
    "used_in_operation",
    "manual_adjustment",
    "refund"
  ]),

  operationId: z.string().optional(),
  paymentId: z.string().optional(),

  createdAt: z.date(),
});

export type ClientCreditLedger = z.infer<typeof clientCreditLedgerSchema>;
