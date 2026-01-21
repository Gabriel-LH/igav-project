import z from "zod";
import { saleItemSchema } from "./type.saleItem";

export const saleSchema = z.object({
  id: z.string(),
  operationId: z.number(), // Conecta con la transacción financiera
  customerId: z.string(),
  branchId: z.string(),
  sellerId: z.string(),
  
  totalAmount: z.number(),
  saleDate: z.date(),
  
  status: z.enum(["completado", "cancelado", "pendiente_entrega"]),
  notes: z.string().optional(),
  createdAt: z.date(),
});

export type Sale = z.infer<typeof saleSchema>;

export const saleWithItemsSchema = saleSchema.extend({
  items: z.array(saleItemSchema),
});

export type SaleWithItems = z.infer<typeof saleWithItemsSchema>;