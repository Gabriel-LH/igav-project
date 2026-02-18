import { z } from "zod";

export const salesPendingSchema = z.object({
  id: z.string(),
  branchName: z.string(), // Sucursal
  sellerName: z.string(), // Vendedor
  outDate: z.string(), // Fecha de salida
  createdAt: z.string(), // Fecha de registro
  nameCustomer: z.string(), // Nombre del cliente
  product: z.string(), // Producto
  count: z.number(), // Cantidad
  income: z.number(), // Ingreso
  status: z.string(), // Estado
  summary: z.string().optional(),
  itemsDetail: z.array(z.any()).optional(),
  searchContent: z.string().optional(),
});
