import { z } from "zod";

export const salesHistorySchema = z.object({
  id: z.string(),
  branchName: z.string(),
  sellerName: z.string(),
  // registerDate: z.string(),
  outDate: z.string(),
  realOutDate: z.string().optional(),
  nameCustomer: z.string(), // Nombre del cliente
  product: z.string(), // Producto
  count: z.number(), // Cantidad
  income: z.number(), // Ingreso
  status: z.string(), // Estado
});
