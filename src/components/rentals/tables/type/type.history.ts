import { z } from "zod";

export const rentalsHistorySchema = z.object({
  id: z.string(),
  branchName: z.string(),
  sellerName: z.string(),
  damage: z.string(),
  outDate: z.string(),
  expectedReturnDate: z.string(),
  returnDate: z.string(),
  nameCustomer: z.string(), // Nombre del cliente
  product: z.string(), // Producto
  rent_unit: z.string(), // Evento o dia
  count: z.number(), // Cantidad
  income: z.number(), // Ingreso
  gurantee_type: z.string(), // Garantia
  gurantee_value: z.string(), // Garantia
  guarantee_status: z.string(), // Estado de garantia
  status: z.string(), // Estado
});
